from datetime import date

from calendar_bo import class_day_share, easter_sunday, holidays_of, is_class_day, is_holiday

# The list the previous version of the calendar typed by hand. The rule has
# to reproduce it exactly, or the change of method changed the data.
HAND_WRITTEN_2026 = [
    "2026-01-01", "2026-01-22", "2026-02-16", "2026-02-17", "2026-04-03",
    "2026-04-15", "2026-05-01", "2026-06-04", "2026-06-21", "2026-08-06",
    "2026-11-02", "2026-12-25",
]  # fmt: skip


def test_easter_matches_published_dates():
    assert easter_sunday(2021) == date(2021, 4, 4)
    assert easter_sunday(2024) == date(2024, 3, 31)
    assert easter_sunday(2026) == date(2026, 4, 5)


def test_rule_reproduces_the_hand_written_list():
    assert [d.isoformat() for d in holidays_of(2026)] == HAND_WRITTEN_2026


def test_movable_holidays_follow_easter():
    # Carnival 2023: Easter April 9 minus 48 and 47 days.
    assert is_holiday(date(2023, 2, 20))
    assert is_holiday(date(2023, 2, 21))


def test_class_days_exclude_weekends_holidays_and_vacations():
    assert is_class_day(date(2026, 3, 10))  # an ordinary Tuesday
    assert not is_class_day(date(2026, 3, 14))  # Saturday
    assert not is_class_day(date(2026, 5, 1))  # Labour Day
    assert not is_class_day(date(2026, 7, 8))  # winter vacation


def test_class_day_share_of_an_empty_interval_is_zero():
    assert class_day_share(date(2026, 3, 10), date(2026, 3, 9)) == 0.0


def test_class_day_share_counts_both_ends():
    # Monday to Sunday of a normal week: five class days out of seven.
    assert class_day_share(date(2026, 3, 9), date(2026, 3, 15)) == 5 / 7
