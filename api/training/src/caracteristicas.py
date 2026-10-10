"""Feature engineering from the raw inputs of one lot review.

The API receives exactly the raw fields described in `EntradaLote` and must
compute the same features. To guarantee it, the training dataset is built by
calling `construir_caracteristicas` on the raw rows, and a sample of raw rows
with their expected features and probabilities is exported as a parity
fixture for the TypeScript tests.

Every operation here is mirrored line by line in
`ml-api/.../domain/services/caracteristicas.service.ts`. Change one, change both.
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import TypedDict

from calendario import proporcion_de_clases

CATEGORIAS = ["lacteos", "fiambres", "panaderia", "frutas", "huevos"]

# Coverage is capped so a lot with zero recent consumption does not produce
# an infinite value; 999 days is far beyond any shelf life in the catalog.
COBERTURA_MAXIMA = 999.0

VARIABLES = [
    "dias_para_vencer",
    "edad_dias",
    "vida_util_dias",
    "porcentaje_restante",
    "consumo_7d",
    "consumo_28d",
    "tendencia_consumo",
    "dias_cobertura",
    "holgura_dias",
    "fraccion_por_delante",
    "proporcion_clases_restante",
    "proporcion_clases_7d",
    "dia_semana",
    *[f"cat_{c}" for c in CATEGORIAS],
]


class EntradaLote(TypedDict):
    categoria: str
    fecha_ingreso: str
    fecha_vencimiento: str
    fecha_revision: str
    cantidad_inicial: float
    cantidad_restante: float
    stock_por_delante: float
    consumo_7d: float | None  # average daily consumption, last 7 days
    consumo_28d: float | None  # average daily consumption, last 28 days


def _nan(valor: float | None) -> float:
    return math.nan if valor is None else float(valor)


def construir_caracteristicas(e: EntradaLote) -> list[float]:
    ingreso = date.fromisoformat(e["fecha_ingreso"])
    vence = date.fromisoformat(e["fecha_vencimiento"])
    revision = date.fromisoformat(e["fecha_revision"])

    dias_para_vencer = float((vence - revision).days)
    edad = float((revision - ingreso).days)
    vida_util = float((vence - ingreso).days)

    inicial = float(e["cantidad_inicial"])
    restante = float(e["cantidad_restante"])
    por_delante = float(e["stock_por_delante"])
    c7 = _nan(e["consumo_7d"])
    c28 = _nan(e["consumo_28d"])

    porcentaje_restante = restante / inicial

    if math.isnan(c28) or c28 == 0.0 or math.isnan(c7):
        tendencia = math.nan
    else:
        tendencia = c7 / c28

    if math.isnan(c7):
        cobertura = math.nan
    elif c7 <= 0.0:
        cobertura = COBERTURA_MAXIMA
    else:
        cobertura = min((por_delante + restante) / c7, COBERTURA_MAXIMA)

    holgura = math.nan if math.isnan(cobertura) else dias_para_vencer + 1.0 - cobertura

    total_cola = por_delante + restante
    fraccion_por_delante = por_delante / total_cola if total_cola > 0 else 0.0

    clases_restante = proporcion_de_clases(revision, vence)
    clases_7d = proporcion_de_clases(revision - timedelta(days=7), revision - timedelta(days=1))

    categorias = [1.0 if e["categoria"] == c else 0.0 for c in CATEGORIAS]

    return [
        dias_para_vencer,
        edad,
        vida_util,
        porcentaje_restante,
        c7,
        c28,
        tendencia,
        cobertura,
        holgura,
        fraccion_por_delante,
        clases_restante,
        clases_7d,
        float(revision.weekday()),
        *categorias,
    ]


def regla_de_cobertura(caracteristicas: list[float]) -> int:
    """Honest baseline: flag the lot if, at the recent pace, it will not be
    used up before it expires. Without consumption data it cannot judge, and
    it does not flag (that is what a person reading the kardex would do)."""
    holgura = caracteristicas[VARIABLES.index("holgura_dias")]
    return 0 if math.isnan(holgura) else int(holgura < 0.0)
