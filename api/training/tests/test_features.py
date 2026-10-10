import math

import pytest

from features import FEATURES, MAX_COVERAGE_DAYS, build_features, coverage_rule


def review(**overrides):
    base = {
        "family": "dairy",
        "received_on": "2026-03-02",
        "expires_on": "2026-03-12",
        "reviewed_on": "2026-03-06",
        "initial_quantity": 10_000.0,
        "remaining_quantity": 4_000.0,
        "stock_ahead": 2_000.0,
        "usage_7d": 1_000.0,
        "usage_28d": 800.0,
    }
    return base | overrides


def feature(values, name):
    return values[FEATURES.index(name)]


def test_dates_become_ages_and_horizons():
    values = build_features(review())
    assert feature(values, "days_to_expiry") == 6
    assert feature(values, "age_days") == 4
    assert feature(values, "shelf_life_days") == 10


def test_coverage_counts_the_whole_fefo_queue():
    # 2,000 ahead plus 4,000 of this lot, at 1,000 a day: six days.
    values = build_features(review())
    assert feature(values, "coverage_days") == 6
    # Usable on its expiry day too: 6 days to expiry + 1 - 6 days of coverage.
    assert feature(values, "slack_days") == 1
    assert feature(values, "share_ahead_fefo") == pytest.approx(1 / 3)


def test_trend_compares_last_week_with_last_month():
    assert feature(build_features(review()), "usage_trend") == pytest.approx(1.25)


def test_missing_usage_leaves_coverage_unknown_instead_of_guessing():
    values = build_features(review(usage_7d=None, usage_28d=None))
    assert math.isnan(feature(values, "coverage_days"))
    assert math.isnan(feature(values, "slack_days"))
    assert math.isnan(feature(values, "usage_trend"))


def test_zero_usage_caps_coverage_instead_of_dividing_by_zero():
    values = build_features(review(usage_7d=0.0))
    assert feature(values, "coverage_days") == MAX_COVERAGE_DAYS


def test_family_is_one_hot():
    values = build_features(review(family="eggs"))
    flags = [feature(values, f"family_{name}") for name in ("dairy", "cold_cuts", "bakery", "produce", "eggs")]
    assert flags == [0, 0, 0, 0, 1]


def test_rule_flags_only_negative_slack():
    assert coverage_rule(build_features(review())) == 0  # one day of slack
    assert coverage_rule(build_features(review(usage_7d=500.0))) == 1  # 12 days of stock, 7 days left


def test_rule_does_not_flag_without_usage_data():
    assert coverage_rule(build_features(review(usage_7d=None))) == 0
