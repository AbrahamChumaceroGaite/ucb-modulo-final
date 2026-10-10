"""Train, validate and export the lot-expiry risk model.

Usage (after `build_dataset.py`):
    python src/train.py

Everything is deterministic (fixed seeds, single-thread LightGBM): two runs
give the same artifacts, except for the `trainedAt` timestamp.

1. Features are built from the raw review rows with the code the API mirrors.
2. Rows are split by the lot's entry date into train / validation / test,
   with a 29-day embargo (longest perishable shelf life plus one), so no lot
   and no outcome crosses partitions. Random k-fold is not used: it would
   predict the past with the future.
3. Four methods are compared on the SAME test rows: current practice (never
   warns), the coverage rule, logistic regression and LightGBM.
4. Hyperparameters and thresholds are chosen on validation only. The test
   partition is scored once, at the end.
"""

from __future__ import annotations

import json
import math
from datetime import date, timedelta

import numpy as np
import pandas as pd

import calendar_bo
import figures
from evaluation import classification_metrics, early_warning_share, lot_bootstrap, mcnemar, threshold_for_recall
from export import RAW_INPUTS, export_model, export_parity
from features import FEATURES, build_features, coverage_rule
from models import train_lightgbm, train_logistic
from paths import ARTIFACTS, DATA, FIGURES, RESULTS

SEED = 20261010
MODEL_VERSION = "2.0.0"
TARGET_RECALL = 0.85
EMBARGO = timedelta(days=29)

PARTITIONS = {
    "train": (date(2021, 10, 1), date(2024, 6, 30)),
    "validation": (date(2024, 6, 30) + EMBARGO, date(2025, 6, 30)),
    "test": (date(2025, 6, 30) + EMBARGO, date(2026, 9, 30)),
}

DAYS_BANDS = ([-1, 0, 1, 3, 7, 30], ["0", "1", "2-3", "4-7", "8+"])


def load_reviews() -> pd.DataFrame:
    reviews = pd.read_csv(DATA / "reviews.csv")
    reviews["expired"] = reviews["expired"].astype(int)

    raw = reviews[RAW_INPUTS].astype(object).where(reviews[RAW_INPUTS].notna(), None)
    matrix = [build_features(row) for row in raw.to_dict("records")]
    computed = pd.DataFrame(matrix, columns=FEATURES, index=reviews.index)
    # Usage averages are raw inputs and features at the same time; keep one copy.
    assert np.allclose(computed["usage_7d"], reviews["usage_7d"], equal_nan=True)
    rows = pd.concat([reviews, computed[[c for c in FEATURES if c not in reviews]]], axis=1)

    received = pd.to_datetime(rows["received_on"]).dt.date
    rows["partition"] = None
    for name, (start, end) in PARTITIONS.items():
        rows.loc[(received >= start) & (received <= end), "partition"] = name
    rows["rule_pred"] = [coverage_rule(list(f)) for f in rows[FEATURES].itertuples(index=False)]
    return rows


def error_tables(test: pd.DataFrame, y: np.ndarray, preds: dict) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    errors = test.assign(
        rule_false_negative=(y == 1) & (preds["rule"] == 0),
        model_false_negative=(y == 1) & (preds["model"] == 0),
        rule_false_positive=(y == 0) & (preds["rule"] == 1),
        model_false_positive=(y == 0) & (preds["model"] == 1),
        days_band=pd.cut(test["days_to_expiry"], *DAYS_BANDS),
    )
    columns = ["expired", "rule_false_negative", "model_false_negative", "rule_false_positive", "model_false_positive"]
    by_product = errors.groupby("product")[columns].sum().astype(int)
    by_days = errors.groupby("days_band", observed=True)[columns].sum().astype(int)
    return errors, by_product, by_days


def main() -> None:
    for folder in (ARTIFACTS, FIGURES, RESULTS):
        folder.mkdir(exist_ok=True)
    calendar_bo.export(ARTIFACTS / "calendar.json")

    rows = load_reviews()
    lots = pd.read_csv(DATA / "lots.csv")
    figures.diagnostics(rows, lots)

    train, val, test = (rows[rows["partition"] == name] for name in PARTITIONS)
    y_train, y_val, y_test = (part["expired"].to_numpy() for part in (train, val, test))

    logistic = train_logistic(train[FEATURES], y_train, SEED)
    lightgbm, search = train_lightgbm(train[FEATURES], y_train, val[FEATURES], y_val, SEED)

    threshold_logistic = threshold_for_recall(y_val, logistic.predict_proba(val[FEATURES])[:, 1], TARGET_RECALL)
    threshold_model = threshold_for_recall(y_val, lightgbm.predict_proba(val[FEATURES])[:, 1], TARGET_RECALL)

    probs = {
        "logistic": logistic.predict_proba(test[FEATURES])[:, 1],
        "model": lightgbm.predict_proba(test[FEATURES])[:, 1],
    }
    preds = {
        "current": np.zeros_like(y_test),
        "rule": test["rule_pred"].to_numpy(),
        "logistic": (probs["logistic"] >= threshold_logistic).astype(int),
        "model": (probs["model"] >= threshold_model).astype(int),
    }

    test_results = {
        name: {**classification_metrics(y_test, pred, probs.get(name)), "earlyWarning2Days": early_warning_share(test, pred)}
        for name, pred in preds.items()
    }
    test_results["logistic"]["threshold"] = threshold_logistic
    test_results["model"]["threshold"] = threshold_model

    validation_results = {
        "rule": classification_metrics(y_val, val["rule_pred"].to_numpy()),
        "logistic": classification_metrics(y_val, (logistic.predict_proba(val[FEATURES])[:, 1] >= threshold_logistic).astype(int)),
        "model": classification_metrics(y_val, (lightgbm.predict_proba(val[FEATURES])[:, 1] >= threshold_model).astype(int)),
    }
    comparison = {
        "mcnemarModelVsRule": mcnemar(y_test, preds["model"], preds["rule"]),
        "bootstrapRecallModelMinusRule": lot_bootstrap(test, y_test, preds["model"], preds["rule"], SEED),
    }

    errors, by_product, by_days = error_tables(test, y_test, preds)
    by_product.to_csv(RESULTS / "errors_by_product.csv")
    by_days.to_csv(RESULTS / "errors_by_days.csv")
    figures.results(y_test, probs, preds, lightgbm, errors)

    sizes = {
        name: {
            "rows": int(len(part)),
            "lots": int(part["lot_id"].nunique()),
            "positiveShare": float(part["expired"].mean()),
            "from": PARTITIONS[name][0].isoformat(),
            "to": PARTITIONS[name][1].isoformat(),
        }
        for name, part in (("train", train), ("validation", val), ("test", test))
    }
    api_summary = {
        "test": {
            "model": {k: test_results["model"][k] for k in ("recall", "precision", "accuracy", "f1", "prAuc", "earlyWarning2Days")},
            "rule": {k: test_results["rule"][k] for k in ("recall", "precision", "accuracy", "f1", "earlyWarning2Days")},
        },
        "partitions": sizes,
    }
    export_model(lightgbm, threshold_model, TARGET_RECALL, SEED, MODEL_VERSION, api_summary)
    export_parity(rows[rows["partition"].notna()], lightgbm, SEED)

    tuned = ("num_leaves", "learning_rate", "min_child_samples", "subsample", "colsample_bytree", "reg_lambda")
    chosen = {k: v for k, v in lightgbm.get_params().items() if k in tuned}
    report = {
        "partitions": sizes,
        "test": test_results,
        "validation": validation_results,
        "comparison": comparison,
        "hyperparameterSearch": search,
        "chosenParameters": chosen | {"trees": int(lightgbm.best_iteration_)},
        "errorsByProduct": by_product.reset_index().to_dict("records"),
        "errorsByDays": by_days.reset_index().astype({"days_band": str}).to_dict("records"),
        "missing": {c: float(rows[c].isna().mean()) for c in ("usage_7d", "usage_28d")},
        "rowsOutsidePartitions": int(rows["partition"].isna().sum()),
    }
    (RESULTS / "metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    def fmt(value: float | None) -> str:
        return "  -  " if value is None or (isinstance(value, float) and math.isnan(value)) else f"{value:.3f}"

    print(json.dumps(sizes, indent=2))
    print(f"{'method':<10} {'recall':>7} {'prec':>7} {'acc':>7} {'f1':>7} {'pr-auc':>7} {'warn2d':>7}")
    for name, result in test_results.items():
        values = (result[k] for k in ("recall", "precision", "accuracy", "f1", "prAuc", "earlyWarning2Days"))
        print(f"{name:<10} " + " ".join(f"{fmt(v):>7}" for v in values))
    print(json.dumps(comparison, indent=2))


if __name__ == "__main__":
    main()
