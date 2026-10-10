"""Artifacts the NestJS API loads: the model as JSON and a parity fixture."""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone

import lightgbm as lgb
import pandas as pd

from features import FAMILIES, FEATURES, MAX_COVERAGE_DAYS
from paths import ARTIFACTS, DATA

RAW_INPUTS = [
    "family",
    "received_on",
    "expires_on",
    "reviewed_on",
    "initial_quantity",
    "remaining_quantity",
    "stock_ahead",
    "usage_7d",
    "usage_28d",
]


def _none_if_nan(row: dict) -> dict:
    return {k: (None if isinstance(v, float) and math.isnan(v) else v) for k, v in row.items()}


def export_model(model: lgb.LGBMClassifier, threshold: float, target_recall: float, seed: int, version: str, summary: dict) -> None:
    """The trees are exported as JSON and evaluated in TypeScript, so the API
    needs no Python runtime. `model_lightgbm.txt` keeps the native format for
    anyone who wants to reload it in LightGBM."""
    dump = model.booster_.dump_model()
    catalog = json.loads((DATA / "catalog.json").read_text(encoding="utf-8"))
    artifact = {
        "version": version,
        "trainedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "seed": seed,
        "features": FEATURES,
        "families": FAMILIES,
        "threshold": threshold,
        "targetRecall": target_recall,
        "maxCoverageDays": MAX_COVERAGE_DAYS,
        "products": [
            {
                "productId": item["product_id"],
                "name": item["name"],
                "family": item["family"],
                "unit": item["unit"],
                "medianShelfLifeDays": item["median_shelf_life_days"],
            }
            for item in catalog
        ],
        "metrics": summary,
        "lightgbm": {
            "objective": dump["objective"],
            "treeCount": len(dump["tree_info"]),
            "trees": [tree["tree_structure"] for tree in dump["tree_info"]],
        },
    }
    (ARTIFACTS / "risk_model.json").write_text(json.dumps(artifact, ensure_ascii=False), encoding="utf-8")
    model.booster_.save_model(str(ARTIFACTS / "model_lightgbm.txt"))


def export_parity(rows: pd.DataFrame, model: lgb.LGBMClassifier, seed: int) -> None:
    """Raw inputs, expected features and expected probability, for the API tests.

    Parity is about computing the same thing, not about generalisation, so
    rows come from every partition. Rows with missing usage (only at the
    start of a product's history) are added on purpose: that is where a port
    is most likely to diverge."""
    sample = rows.sample(n=400, random_state=seed)
    missing = rows[rows["usage_28d"].isna() | rows["usage_7d"].isna()]
    sample = pd.concat([sample, missing.sample(n=min(40, len(missing)), random_state=seed)])
    sample = sample.drop_duplicates(subset=["lot_id", "reviewed_on"])

    probabilities = model.booster_.predict(sample[FEATURES])
    cases = [
        {
            "input": _none_if_nan({name: row[name] for name in RAW_INPUTS}),
            "features": [None if math.isnan(v) else v for v in row[FEATURES].astype(float)],
            "probability": float(probability),
            "rule": int(row["rule_pred"]),
        }
        for (_, row), probability in zip(sample.iterrows(), probabilities, strict=True)
    ]
    (ARTIFACTS / "parity.json").write_text(json.dumps(cases, ensure_ascii=False), encoding="utf-8")
