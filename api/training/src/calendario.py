"""Operational calendar known in advance: holidays and academic vacations.

This file is the single source of truth for the calendar. It is exported to
`artefactos/calendario.json`, and the NestJS API loads that same JSON, so the
features computed in training and in inference come from identical data.

Only information a cafeteria manager knows beforehand goes here (holidays,
university vacation periods). The demand factors the simulator uses are NOT
here: those are the hidden "truth" the model has to learn from the data.
"""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

# Bolivian national holidays plus Tarija's departmental day (April 15).
# Movable dates (Carnaval, Good Friday, Corpus Christi) are listed per year.
FERIADOS: dict[int, list[str]] = {
    2025: [
        "2025-01-01", "2025-01-22", "2025-03-03", "2025-03-04", "2025-04-15",
        "2025-04-18", "2025-05-01", "2025-06-19", "2025-06-21", "2025-08-06",
        "2025-11-02", "2025-12-25",
    ],
    2026: [
        "2026-01-01", "2026-01-22", "2026-02-16", "2026-02-17", "2026-04-03",
        "2026-04-15", "2026-05-01", "2026-06-04", "2026-06-21", "2026-08-06",
        "2026-11-02", "2026-12-25",
    ],
    2027: [
        "2027-01-01", "2027-01-22", "2027-02-08", "2027-02-09", "2027-03-26",
        "2027-04-15", "2027-05-01", "2027-05-27", "2027-06-21", "2027-08-06",
        "2027-11-02", "2027-12-25",
    ],
}

# University vacation periods, as (month, day) ranges repeated every year.
VACACIONES: list[tuple[str, str]] = [("01-01", "02-14"), ("07-01", "07-21"), ("12-15", "12-31")]

ANIO_MIN = min(FERIADOS)
ANIO_MAX = max(FERIADOS)

_FERIADOS_SET = {date.fromisoformat(d) for dias in FERIADOS.values() for d in dias}


def cubre(dia: date) -> bool:
    return ANIO_MIN <= dia.year <= ANIO_MAX


def es_feriado(dia: date) -> bool:
    return dia in _FERIADOS_SET


def es_vacacion(dia: date) -> bool:
    clave = f"{dia.month:02d}-{dia.day:02d}"
    return any(inicio <= clave <= fin for inicio, fin in VACACIONES)


def es_dia_de_clases(dia: date) -> bool:
    """Monday to Friday, not a holiday and not inside a vacation period."""
    return dia.weekday() < 5 and not es_feriado(dia) and not es_vacacion(dia)


def proporcion_de_clases(desde: date, hasta: date) -> float:
    """Share of class days in the closed interval [desde, hasta]."""
    if hasta < desde:
        return 0.0
    total = (hasta - desde).days + 1
    clases = sum(es_dia_de_clases(desde + timedelta(days=i)) for i in range(total))
    return clases / total


def exportar(destino: Path) -> None:
    contenido = {
        "descripcion": "Calendario operativo conocido de antemano: feriados de Bolivia y Tarija, y vacaciones universitarias.",
        "anioMinimo": ANIO_MIN,
        "anioMaximo": ANIO_MAX,
        "feriados": sorted(d for dias in FERIADOS.values() for d in dias),
        "vacaciones": [{"desde": a, "hasta": b} for a, b in VACACIONES],
    }
    destino.write_text(json.dumps(contenido, ensure_ascii=False, indent=2), encoding="utf-8")
