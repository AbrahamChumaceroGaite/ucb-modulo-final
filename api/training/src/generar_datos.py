"""Synthetic but coherent data for the Kaffehaus perishable-lot problem.

Why synthetic: the cafeteria does not yet keep a lot-level kardex with
expiry dates (the inventory module that would store it is what this project
is building), so there is no real history to learn from. The generator
reproduces the mechanics that produce waste in a real cafeteria:

- Demand depends on the weekday, the university calendar and holidays, with
  noise and a slow random drift per item.
- The manager orders from last week's average and ignores the calendar, so he
  over-buys before weekends, holidays and vacations. Sometimes he takes a
  supplier offer (double order) and sometimes he forgets to order.
- Lots are consumed first-expired-first-out (FEFO) and expire at the end of
  their expiry date. A lot is labelled "vencido" if more than 2 % of what was
  bought is still there when it expires.
- About 3 % of days the kardex is not registered for an item: the item is
  consumed but the history used for features has a hole.

Outputs (in `datos/`):
- `revisiones.csv`: one row per (lot, review day), the unit of observation,
  with the raw inputs the API receives plus the label.
- `consumo_diario.csv`: real and registered daily consumption per item.
- `lotes.csv`: one row per lot with its outcome.
- `lotes_vigentes.json`: lots still open at the cut date, without label, used
  to seed the API list.

Limitations are listed in the README: this is a model of the problem, not
the problem. Results measure how well the pipeline recovers the mechanics
that were put in, not how a real cafeteria behaves.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from calendario import es_feriado, es_vacacion

SEMILLA = 20261003
INICIO = date(2025, 4, 1)
CORTE = date(2026, 10, 2)  # last day with known consumption
REVISION_VIGENTES = CORTE + timedelta(days=1)  # "today" for the seed list
TOLERANCIA_VENCIDO = 0.02
PROB_SIN_REGISTRO = 0.03

RAIZ = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Insumo:
    codigo: str
    nombre: str
    categoria: str
    unidad: str
    vida_util: int
    paquete: float  # purchase unit (how it is bought)
    consumo_base: float  # average daily consumption on a normal class day
    cobertura_objetivo: int  # days the manager tries to cover per order
    decimales: int


CATALOGO = [
    Insumo("LEC-ENT", "Leche entera", "lacteos", "L", 7, 1.0, 7.0, 3, 1),
    Insumo("LEC-DES", "Leche deslactosada", "lacteos", "L", 7, 1.0, 1.6, 4, 1),
    Insumo("CRE-LEC", "Crema de leche", "lacteos", "L", 10, 0.5, 0.35, 6, 2),
    Insumo("YOG-NAT", "Yogur natural", "lacteos", "kg", 14, 1.0, 0.5, 7, 2),
    Insumo("QUE-MOZ", "Queso mozzarella", "lacteos", "kg", 15, 0.5, 0.35, 7, 2),
    Insumo("JAM-PIE", "Jamón de pierna", "fiambres", "kg", 8, 0.5, 0.4, 5, 2),
    Insumo("POL-COC", "Pechuga de pollo cocida", "fiambres", "kg", 4, 0.5, 0.6, 3, 2),
    Insumo("PAN-MOL", "Pan de molde", "panaderia", "paq.", 5, 1.0, 1.8, 3, 0),
    Insumo("CRO-MAN", "Croissant de mantequilla", "panaderia", "u", 3, 6.0, 11.0, 2, 0),
    Insumo("FRU-FRE", "Frutilla", "frutas", "kg", 4, 0.5, 0.55, 3, 2),
    Insumo("FRU-PLA", "Plátano", "frutas", "kg", 5, 1.0, 0.9, 4, 1),
    Insumo("FRU-PAL", "Palta", "frutas", "kg", 4, 0.5, 0.45, 3, 2),
    Insumo("HUE-GAL", "Huevo de gallina", "huevos", "u", 21, 30.0, 14.0, 7, 0),
]

# Hidden demand mechanics. These are NOT features: the model only sees the
# known calendar (holidays, vacations) and the consumption history.
FACTOR_DIA = [1.0, 1.05, 1.0, 1.1, 1.15, 0.6, 0.35]  # Monday..Sunday
FACTOR_VACACION = 0.55
FACTOR_FERIADO = 0.3


@dataclass
class Lote:
    id: str
    insumo: Insumo
    ingreso: date
    vence: date
    inicial: float
    restante: float
    cerrado: date | None = None
    vencido: bool | None = None
    merma: float = 0.0


@dataclass
class EstadoInsumo:
    insumo: Insumo
    lotes: list[Lote] = field(default_factory=list)
    deriva: float = 1.0
    registrado: list[float] = field(default_factory=list)  # NaN where missing
    dias: list[date] = field(default_factory=list)

    def abiertos(self) -> list[Lote]:
        return sorted(
            (l for l in self.lotes if l.cerrado is None),
            key=lambda l: (l.vence, l.ingreso, l.id),
        )

    def stock(self) -> float:
        return sum(l.restante for l in self.lotes if l.cerrado is None)


def redondear(valor: float, decimales: int) -> float:
    return round(valor, decimales)


def promedio_registrado(estado: EstadoInsumo, dias: int) -> float | None:
    """Average daily registered consumption over the last `dias` days.

    Days without registration are skipped. If the history is shorter than the
    window, or no day in it was registered, the value is unknown (None)."""
    if len(estado.registrado) < dias:
        return None
    ventana = np.array(estado.registrado[-dias:], dtype=float)
    validos = ventana[~np.isnan(ventana)]
    if validos.size == 0:
        return None
    return float(validos.mean())


def demanda_del_dia(rng: np.random.Generator, estado: EstadoInsumo, dia: date) -> float:
    insumo = estado.insumo
    factor = FACTOR_DIA[dia.weekday()]
    if es_vacacion(dia):
        factor *= FACTOR_VACACION
    if es_feriado(dia):
        factor *= FACTOR_FERIADO
    # Occasional events: a congress, an exam week, a group order.
    if rng.random() < 0.04:
        factor *= rng.uniform(1.3, 1.8)
    estado.deriva = float(np.clip(estado.deriva * math.exp(rng.normal(0, 0.02)), 0.75, 1.3))
    ruido = rng.gamma(shape=16.0, scale=1 / 16.0)  # mean 1, CV 0.25
    return insumo.consumo_base * factor * estado.deriva * ruido


def comprar(rng: np.random.Generator, estado: EstadoInsumo, dia: date, contador: list[int]) -> None:
    """The manager's real policy: last week's average, no calendar."""
    insumo = estado.insumo
    estimado = promedio_registrado(estado, 7) or insumo.consumo_base
    stock = estado.stock()
    if stock >= estimado * 1.5:
        return
    if rng.random() < 0.05:  # forgot to order today
        return
    faltante = estimado * insumo.cobertura_objetivo - stock
    paquetes = max(1, math.ceil(faltante / insumo.paquete))
    if rng.random() < 0.12:  # supplier offer: takes double
        paquetes *= 2
    cantidad = redondear(paquetes * insumo.paquete, insumo.decimales)
    vida = max(2, insumo.vida_util + int(rng.integers(-1, 2)))
    contador[0] += 1
    estado.lotes.append(
        Lote(
            id=f"L{contador[0]:06d}",
            insumo=insumo,
            ingreso=dia,
            vence=dia + timedelta(days=vida),
            inicial=cantidad,
            restante=cantidad,
        )
    )


def revisiones_del_dia(estado: EstadoInsumo, dia: date) -> list[dict]:
    """Snapshot of every open lot on the morning of `dia`, before consuming.

    Uses only what is known that morning: lot data and the registered history
    up to yesterday."""
    c7 = promedio_registrado(estado, 7)
    c28 = promedio_registrado(estado, 28)
    filas = []
    acumulado = 0.0
    for lote in estado.abiertos():
        filas.append(
            {
                "id_lote": lote.id,
                "codigo_insumo": estado.insumo.codigo,
                "insumo": estado.insumo.nombre,
                "categoria": estado.insumo.categoria,
                "unidad": estado.insumo.unidad,
                "fecha_ingreso": lote.ingreso.isoformat(),
                "fecha_vencimiento": lote.vence.isoformat(),
                "fecha_revision": dia.isoformat(),
                "cantidad_inicial": lote.inicial,
                "cantidad_restante": redondear(lote.restante, estado.insumo.decimales + 1),
                "stock_por_delante": redondear(acumulado, estado.insumo.decimales + 1),
                "consumo_7d": None if c7 is None else round(c7, 4),
                "consumo_28d": None if c28 is None else round(c28, 4),
            }
        )
        acumulado += lote.restante
    return filas


def consumir(estado: EstadoInsumo, cantidad: float) -> float:
    """FEFO consumption. Returns what could not be served (stock-out)."""
    pendiente = cantidad
    for lote in estado.abiertos():
        if pendiente <= 0:
            break
        usado = min(lote.restante, pendiente)
        lote.restante -= usado
        pendiente -= usado
    return max(0.0, pendiente)


def cerrar_lotes(estado: EstadoInsumo, dia: date) -> None:
    for lote in estado.lotes:
        if lote.cerrado is not None:
            continue
        if lote.restante <= 1e-9:
            lote.restante = 0.0
            lote.cerrado = dia
            lote.vencido = False
        elif lote.vence <= dia:
            lote.cerrado = dia
            lote.merma = lote.restante
            lote.vencido = lote.restante > TOLERANCIA_VENCIDO * lote.inicial


def simular() -> None:
    rng = np.random.default_rng(SEMILLA)
    estados = [EstadoInsumo(insumo) for insumo in CATALOGO]
    contador = [0]
    revisiones: list[dict] = []
    consumo: list[dict] = []
    vigentes: list[dict] = []

    dia = INICIO
    # Simulate a few weeks past the cut so lots that were still open at the
    # cut get an outcome; those rows are never used for training or testing.
    fin = CORTE + timedelta(days=30)
    while dia <= fin:
        for estado in estados:
            comprar(rng, estado, dia, contador)
            if dia <= CORTE:
                revisiones.extend(revisiones_del_dia(estado, dia))
            demanda = demanda_del_dia(rng, estado, dia)
            servido = demanda - consumir(estado, demanda)
            registrado = math.nan if rng.random() < PROB_SIN_REGISTRO else servido
            estado.registrado.append(registrado)
            estado.dias.append(dia)
            cerrar_lotes(estado, dia)
            consumo.append(
                {
                    "fecha": dia.isoformat(),
                    "codigo_insumo": estado.insumo.codigo,
                    "demanda": round(demanda, 4),
                    "servido": round(servido, 4),
                    "registrado": None if math.isnan(registrado) else round(registrado, 4),
                }
            )
        if dia == CORTE:
            # Lots open on the morning after the cut, seen with the history up
            # to the cut. Their label is not stored: for the cafeteria their
            # outcome is still the future.
            for estado in estados:
                vigentes.extend(revisiones_del_dia(estado, REVISION_VIGENTES))
        dia += timedelta(days=1)

    lotes = [l for e in estados for l in e.lotes]
    resultado = {l.id: l for l in lotes}

    df_rev = pd.DataFrame(revisiones)
    df_rev["vencido"] = df_rev["id_lote"].map(lambda i: resultado[i].vencido)
    df_rev["fecha_cierre"] = df_rev["id_lote"].map(
        lambda i: resultado[i].cerrado.isoformat() if resultado[i].cerrado else None
    )

    df_lotes = pd.DataFrame(
        [
            {
                "id_lote": l.id,
                "codigo_insumo": l.insumo.codigo,
                "categoria": l.insumo.categoria,
                "fecha_ingreso": l.ingreso.isoformat(),
                "fecha_vencimiento": l.vence.isoformat(),
                "cantidad_inicial": l.inicial,
                "merma": round(l.merma, 4),
                "vencido": l.vencido,
                "fecha_cierre": l.cerrado.isoformat() if l.cerrado else None,
            }
            for l in lotes
        ]
    )

    salida = RAIZ / "datos"
    salida.mkdir(exist_ok=True)
    df_rev.to_csv(salida / "revisiones.csv", index=False)
    pd.DataFrame(consumo).to_csv(salida / "consumo_diario.csv", index=False)
    df_lotes.to_csv(salida / "lotes.csv", index=False)

    (salida / "lotes_vigentes.json").write_text(
        json.dumps(vigentes, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    catalogo = [
        {
            "codigo": i.codigo,
            "nombre": i.nombre,
            "categoria": i.categoria,
            "unidad": i.unidad,
            "vidaUtilDias": i.vida_util,
        }
        for i in CATALOGO
    ]
    (salida / "catalogo_insumos.json").write_text(
        json.dumps(catalogo, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"revisiones: {len(df_rev):,}  lotes: {len(df_lotes):,}  vigentes: {len(vigentes)}")
    print(f"lotes vencidos: {df_lotes['vencido'].mean():.3f}")
    print(f"revisiones de lotes que vencieron: {df_rev['vencido'].mean():.3f}")


if __name__ == "__main__":
    simular()
