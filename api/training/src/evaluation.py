"""Metrics, threshold choice and the statistical comparison between methods."""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.stats import binomtest
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
)


def classification_metrics(y: np.ndarray, pred: np.ndarray, prob: np.ndarray | None = None) -> dict:
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "recall": float(recall_score(y, pred, zero_division=0)),
        "precision": float(precision_score(y, pred, zero_division=0)),
        "accuracy": float(accuracy_score(y, pred)),
        "f1": float(f1_score(y, pred, zero_division=0)),
        "prAuc": None if prob is None else float(average_precision_score(y, prob)),
        "truePositives": int(tp),
        "falsePositives": int(fp),
        "falseNegatives": int(fn),
        "trueNegatives": int(tn),
    }


def threshold_for_recall(y: np.ndarray, prob: np.ndarray, target_recall: float) -> float:
    """Highest-precision threshold whose recall still reaches the target.

    Missing an expiring lot costs more than a false alarm, so recall is fixed
    first and precision is maximised inside that constraint."""
    precision, recall, thresholds = precision_recall_curve(y, prob)
    candidates = [(p, t) for p, r, t in zip(precision[:-1], recall[:-1], thresholds, strict=True) if r >= target_recall]
    if not candidates:
        return float(thresholds.min())
    best = max(p for p, _ in candidates)
    # Among ties in precision, the highest threshold: fewer alarms.
    return float(max(t for p, t in candidates if p == best))


def early_warning_share(rows: pd.DataFrame, pred: np.ndarray, min_days: int = 2) -> float:
    """Share of expired lots flagged at least once with `min_days` or more left.

    This is the business question: was there time to do something about it?"""
    flagged = rows.assign(pred=pred)
    expired = flagged[flagged["expired"] == 1]
    if expired.empty:
        return float("nan")
    in_time = expired[(expired["pred"] == 1) & (expired["days_to_expiry"] >= min_days)]
    return in_time["lot_id"].nunique() / expired["lot_id"].nunique()


def mcnemar(y: np.ndarray, a: np.ndarray, b: np.ndarray) -> dict:
    """Exact McNemar test on the rows where exactly one method is right."""
    only_a = int(np.sum((a == y) & (b != y)))
    only_b = int(np.sum((a != y) & (b == y)))
    disagreements = only_a + only_b
    p_value = 1.0 if disagreements == 0 else float(binomtest(only_a, disagreements, 0.5).pvalue)
    return {"onlyModelRight": only_a, "onlyRuleRight": only_b, "pValue": p_value}


def lot_bootstrap(rows: pd.DataFrame, y: np.ndarray, a: np.ndarray, b: np.ndarray, seed: int, repetitions: int = 2000) -> dict:
    """95 % interval of recall(a) - recall(b), resampling whole lots.

    Reviews of the same lot are correlated; resampling rows would make the
    interval look tighter than it is."""
    rng = np.random.default_rng(seed)
    frame = pd.DataFrame({"lot": rows["lot_id"].to_numpy(), "y": y, "a": a, "b": b})
    groups = [g for _, g in frame.groupby("lot")]
    differences = []
    for _ in range(repetitions):
        sample = pd.concat([groups[i] for i in rng.integers(0, len(groups), len(groups))])
        positives = sample[sample["y"] == 1]
        if not positives.empty:
            differences.append(positives["a"].mean() - positives["b"].mean())
    low, high = np.percentile(differences, [2.5, 97.5])
    return {"recallDifference": float(np.mean(differences)), "ci95": [float(low), float(high)]}
