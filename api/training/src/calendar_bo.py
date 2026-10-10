"""Operational calendar known in advance: Bolivian holidays and university vacations.

Exported to `artifacts/calendar.json`; the API loads the same file, so the
class-day features are computed from the same data in training and inference.
Demand is not encoded here: the model learns it from the sales history.

Holidays are computed by rule for 2021-2030; movable ones come from Easter.
A holiday on a Sunday is not moved to Monday.
"""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

FIRST_YEAR = 2021
LAST_YEAR = 2030

# (month, day): New Year, Plurinational State Day, Tarija's departmental day,
# Labour Day, Andean New Year, Independence Day, All Souls' Day, Christmas.
FIXED_HOLIDAYS = [(1, 1), (1, 22), (4, 15), (5, 1), (6, 21), (8, 6), (11, 2), (12, 25)]

# Offsets from Easter Sunday: Carnival Monday and Tuesday, Good Friday, Corpus Christi.
EASTER_OFFSETS = [-48, -47, -2, 60]

# University vacation periods as (from, to) month-day ranges, every year.
VACATIONS = [("01-01", "02-14"), ("07-01", "07-21"), ("12-15", "12-31")]


def easter_sunday(year: int) -> date:
    """Gregorian Easter (anonymous Gregorian algorithm, Meeus/Jones/Butcher)."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    to_sunday = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * to_sunday) // 451
    month, day = divmod(h + to_sunday - 7 * m + 114, 31)
    return date(year, month, day + 1)


def holidays_of(year: int) -> list[date]:
    easter = easter_sunday(year)
    fixed = [date(year, month, day) for month, day in FIXED_HOLIDAYS]
    movable = [easter + timedelta(days=offset) for offset in EASTER_OFFSETS]
    return sorted(fixed + movable)


_HOLIDAYS = {day for year in range(FIRST_YEAR, LAST_YEAR + 1) for day in holidays_of(year)}


def covers(day: date) -> bool:
    return FIRST_YEAR <= day.year <= LAST_YEAR


def is_holiday(day: date) -> bool:
    return day in _HOLIDAYS


def is_vacation(day: date) -> bool:
    key = f"{day.month:02d}-{day.day:02d}"
    return any(start <= key <= end for start, end in VACATIONS)


def is_class_day(day: date) -> bool:
    """Monday to Friday, not a holiday and not inside a vacation period."""
    return day.weekday() < 5 and not is_holiday(day) and not is_vacation(day)


def class_day_share(start: date, end: date) -> float:
    """Share of class days in the closed interval [start, end]."""
    if end < start:
        return 0.0
    total = (end - start).days + 1
    return sum(is_class_day(start + timedelta(days=i)) for i in range(total)) / total


def export(target: Path) -> None:
    content = {
        "description": "Calendario operativo conocido de antemano: feriados de Bolivia y Tarija, y vacaciones universitarias.",
        "firstYear": FIRST_YEAR,
        "lastYear": LAST_YEAR,
        "holidays": sorted(day.isoformat() for day in _HOLIDAYS),
        "vacations": [{"from": start, "to": end} for start, end in VACATIONS],
    }
    target.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
