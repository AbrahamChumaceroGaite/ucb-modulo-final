"""From the raw inputs of one lot review to the model features.

The API computes the same features in TypeScript
(`api/src/contexts/expiry_risk/domain/services/features.ts`). Training builds
them with `build_features` on raw rows and exports a sample with the expected
values (`parity.json`) for the API tests. Change one, change both.
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import TypedDict

from calendar_bo import class_day_share

# Product families. The database category column is too coarse (almost every
# perishable is "Insumos"), so families are assigned in `build_dataset.py`.
FAMILIES = ["dairy", "cold_cuts", "bakery", "produce", "eggs"]

# Coverage is capped so a lot with zero recent consumption does not produce an
# infinite value. 999 days is far beyond any perishable shelf life (max 28).
MAX_COVERAGE_DAYS = 999.0

FEATURES = [
    "days_to_expiry",
    "age_days",
    "shelf_life_days",
    "remaining_share",
    "usage_7d",
    "usage_28d",
    "usage_trend",
    "coverage_days",
    "slack_days",
    "share_ahead_fefo",
    "class_share_until_expiry",
    "class_share_last_7d",
    "weekday",
    *[f"family_{name}" for name in FAMILIES],
]


class LotReview(TypedDict):
    family: str
    received_on: str
    expires_on: str
    reviewed_on: str
    initial_quantity: float
    remaining_quantity: float
    stock_ahead: float
    usage_7d: float | None  # average daily usage of the product, last 7 days
    usage_28d: float | None  # average daily usage of the product, last 28 days


def _nan_if_none(value: float | None) -> float:
    return math.nan if value is None else float(value)


def build_features(review: LotReview) -> list[float]:
    received = date.fromisoformat(review["received_on"])
    expires = date.fromisoformat(review["expires_on"])
    reviewed = date.fromisoformat(review["reviewed_on"])

    days_to_expiry = float((expires - reviewed).days)
    age = float((reviewed - received).days)
    shelf_life = float((expires - received).days)

    initial = float(review["initial_quantity"])
    remaining = float(review["remaining_quantity"])
    ahead = float(review["stock_ahead"])
    usage_7d = _nan_if_none(review["usage_7d"])
    usage_28d = _nan_if_none(review["usage_28d"])

    remaining_share = remaining / initial

    no_trend = math.isnan(usage_28d) or usage_28d == 0.0 or math.isnan(usage_7d)
    trend = math.nan if no_trend else usage_7d / usage_28d

    # Days the FEFO queue up to and including this lot lasts at the recent pace.
    if math.isnan(usage_7d):
        coverage = math.nan
    elif usage_7d <= 0.0:
        coverage = MAX_COVERAGE_DAYS
    else:
        coverage = min((ahead + remaining) / usage_7d, MAX_COVERAGE_DAYS)

    # The lot can still be used on its expiry day, hence the +1.
    slack = math.nan if math.isnan(coverage) else days_to_expiry + 1.0 - coverage

    queue = ahead + remaining
    share_ahead = ahead / queue if queue > 0 else 0.0

    class_until_expiry = class_day_share(reviewed, expires)
    class_last_7d = class_day_share(reviewed - timedelta(days=7), reviewed - timedelta(days=1))

    family_flags = [1.0 if review["family"] == name else 0.0 for name in FAMILIES]

    return [
        days_to_expiry,
        age,
        shelf_life,
        remaining_share,
        usage_7d,
        usage_28d,
        trend,
        coverage,
        slack,
        share_ahead,
        class_until_expiry,
        class_last_7d,
        float(reviewed.weekday()),
        *family_flags,
    ]


def coverage_rule(features: list[float]) -> int:
    """Baseline: flag the lot if, at the recent pace, the queue up to it is not
    used up before it expires. Without usage data it cannot judge and does not
    flag, which is what a person reading the stock card would do."""
    slack = features[FEATURES.index("slack_days")]
    return 0 if math.isnan(slack) else int(slack < 0.0)
