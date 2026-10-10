import numpy as np
import pandas as pd

from evaluation import early_warning_share, mcnemar, threshold_for_recall


def test_threshold_reaches_the_target_recall_with_the_best_precision():
    y = np.array([1, 1, 1, 1, 0, 0, 0, 0])
    prob = np.array([0.9, 0.8, 0.7, 0.3, 0.6, 0.2, 0.1, 0.05])
    threshold = threshold_for_recall(y, prob, target_recall=0.75)
    pred = (prob >= threshold).astype(int)

    assert pred[y == 1].mean() >= 0.75
    # 0.7 keeps three of four positives and lets no negative through.
    assert threshold == 0.7


def test_mcnemar_counts_only_the_disagreements():
    y = np.array([1, 1, 0, 0])
    model = np.array([1, 1, 1, 0])
    rule = np.array([0, 1, 0, 0])
    result = mcnemar(y, model, rule)
    assert result["onlyModelRight"] == 1
    assert result["onlyRuleRight"] == 1


def test_early_warning_counts_lots_not_rows():
    rows = pd.DataFrame(
        {
            "lot_id": ["a", "a", "b", "c"],
            "expired": [1, 1, 1, 0],
            "days_to_expiry": [3, 1, 1, 5],
        }
    )
    # Lot "a" is flagged with 3 days left; lot "b" only on its last day.
    pred = np.array([1, 0, 1, 1])
    assert early_warning_share(rows, pred, min_days=2) == 0.5
