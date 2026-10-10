"""Build the lot-review dataset from the Kaffehaus database snapshot.

Usage:
    python src/build_dataset.py [--dump data/raw/backup.sql]

Unit of observation: one perishable lot line (`detalle_lote`) on the morning
of one day it was still open, before that day's usage. Every input is what
the manager could know that morning: the lot itself, its balance, the lots
ahead of it in FEFO order and the product's usage up to yesterday.

Label: the lot expired holding more than 2 % of its content.

How the database records stock (checked on every container, see README):
- Buying a lot creates a `detalle_lote`. Each unit that is opened becomes an
  `existencia` (a container) through an "Apertura" movement; production lots
  get a single container through "Ingreso produccion".
- Usage, waste, expiry and returns are movements on containers. For all
  19,543 containers, entries minus exits equals the stored current content.
- "Vencimiento" also appears when a cancelled sale is returned and thrown
  away: a "Devolucion venta" and a "Vencimiento" of the same amount, on the
  same container, at the same instant. Those are not expiries and are left
  out of the label.

Outputs in `data/`: reviews.csv, lots.csv, daily_usage.csv, catalog.json and
open_lots.json (lots still open after the last day of data).
"""

from __future__ import annotations

import argparse
from datetime import timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from dump_reader import read_tables
from paths import DATA

DEFAULT_DUMP = DATA / "raw" / "backup.sql"

# A product is perishable when its median shelf life is at most this long.
# The data has a clean gap: the longest perishable lives 28 days (eggs) and
# the next product, butter, 46.
PERISHABLE_MAX_DAYS = 30

# Same tolerance as the original problem statement: leftovers under 2 % of
# the lot are a rounding scrap, not waste worth a warning.
EXPIRED_TOLERANCE = 0.02

# Balances below this are treated as an empty lot (float noise from sums).
EMPTY = 1e-6

# The category column in the database is too coarse (almost every perishable
# is "Insumos"), so each perishable product is assigned to a family by hand.
# The build fails if a perishable product is missing here.
FAMILY_BY_PRODUCT = {
    "Leche Pil 1 L": "dairy",
    "Leche Prolac 1 L": "dairy",
    "Crema de leche 1 L": "dairy",
    "Queso criollo 1 kg": "dairy",
    "Jamon El Tejar 1 kg": "cold_cuts",
    "Croissant bandeja x12": "bakery",
    "Pan de molde bolsa 500 g": "bakery",
    "Brownie de chocolate": "bakery",
    "Galletas de mantequilla": "bakery",
    "Tomate 1 kg": "produce",
    "Naranja malla x20": "produce",
    "Huevo maple x30": "eggs",
}

ENTRY = {"Apertura", "Ingreso produccion"}  # content moves into a container
USAGE = {"Consumo venta", "Consumo produccion", "Venta"}
WASTE = {"Merma", "Ajuste negativo"}
RETURN = {"Devolucion venta", "Ajuste positivo"}
EXPIRY = "Vencimiento"

TABLES = ["producto", "unidad", "lote", "detalle_lote", "existencias", "movimientos", "tipo_movimiento"]


def load(dump: Path) -> dict[str, pd.DataFrame]:
    tables = read_tables(dump, TABLES)
    for name, frame in tables.items():
        if "borrado" in frame:
            tables[name] = frame[frame["borrado"] == "f"].copy()
    return tables


def perishable_catalog(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Products whose median shelf life is short enough to expire in use."""
    lines = t["detalle_lote"].merge(t["lote"][["id", "fecha_compra"]].rename(columns={"id": "id_lote"}), on="id_lote")
    shelf_life = (pd.to_datetime(lines["fecha_vencimiento"]) - pd.to_datetime(lines["fecha_compra"]).dt.normalize()).dt.days
    median_life = shelf_life.groupby(lines["id_producto"]).median()

    products = t["producto"].set_index("id")
    catalog = pd.DataFrame(
        {
            "product_id": median_life.index,
            "name": products.loc[median_life.index, "nombre"].to_numpy(),
            "median_shelf_life_days": median_life.to_numpy(),
        }
    )
    catalog = catalog[catalog["median_shelf_life_days"] <= PERISHABLE_MAX_DAYS].copy()

    unmapped = sorted(set(catalog["name"]) - FAMILY_BY_PRODUCT.keys())
    if unmapped:
        raise ValueError(f"Perishable products without a family: {unmapped}")
    catalog["family"] = catalog["name"].map(FAMILY_BY_PRODUCT)
    return catalog.sort_values("name").reset_index(drop=True)


def classify_movements(t: dict[str, pd.DataFrame], catalog: pd.DataFrame) -> pd.DataFrame:
    """Movements of perishable lots, with their lot, day and effect on stock."""
    kinds = t["tipo_movimiento"].set_index("id")["nombre"]
    containers = t["existencias"][["id", "id_detalle_lote"]].rename(columns={"id": "id_existencia"})
    lines = t["detalle_lote"][["id", "id_producto"]].rename(columns={"id": "id_detalle_lote"})

    moves = t["movimientos"][["id_existencia", "cantidad", "fecha_movimiento", "id_tipo_movimiento"]].copy()
    moves["kind"] = moves["id_tipo_movimiento"].map(kinds)
    moves = moves.merge(containers, on="id_existencia").merge(lines, on="id_detalle_lote")
    moves = moves[moves["id_producto"].isin(catalog["product_id"])].copy()

    moves["at"] = pd.to_datetime(moves["fecha_movimiento"])
    moves["day"] = moves["at"].dt.normalize()

    # Returned sales thrown away look like expiries: drop the expiry half of
    # every pair (same container, same instant, same amount).
    returns = moves.loc[moves["kind"] == "Devolucion venta", ["id_existencia", "at", "cantidad"]]
    returns = returns.assign(paired_return=True).drop_duplicates()
    moves = moves.merge(returns, on=["id_existencia", "at", "cantidad"], how="left")
    moves["paired_return"] = moves["paired_return"].fillna(False).astype(bool)
    moves["true_expiry"] = (moves["kind"] == EXPIRY) & ~moves["paired_return"]

    # Outflow from the lot: positive when stock leaves, negative when it comes
    # back. Entries only move content from the lot into a container.
    outflow = np.select(
        [moves["kind"].isin(USAGE | WASTE) | (moves["kind"] == EXPIRY), moves["kind"].isin(RETURN)],
        [moves["cantidad"], -moves["cantidad"]],
        default=0.0,
    )
    moves["outflow"] = outflow
    moves["usage"] = np.where(moves["kind"].isin(USAGE), moves["cantidad"], 0.0)
    return moves


def lot_table(t: dict[str, pd.DataFrame], catalog: pd.DataFrame, moves: pd.DataFrame, cut: pd.Timestamp) -> pd.DataFrame:
    """One row per perishable lot line, with content, outcome and label."""
    lines = t["detalle_lote"].merge(t["lote"][["id", "fecha_compra", "es_produccion"]].rename(columns={"id": "id_lote"}), on="id_lote")
    lines = lines[lines["id_producto"].isin(catalog["product_id"])].copy()

    containers = t["existencias"]
    entered = moves[moves["kind"].isin(ENTRY)].groupby("id_detalle_lote")["cantidad"].sum()
    # Content of one unit of each product: what a freshly opened container holds.
    opened = containers[containers["id"].isin(moves.loc[moves["kind"] == "Apertura", "id_existencia"])]
    opened = opened.merge(lines[["id", "id_producto"]].rename(columns={"id": "id_detalle_lote"}), on="id_detalle_lote")
    unit_content = opened.groupby("id_producto")["contenido_inicial"].agg(lambda s: s.mode().iloc[0])

    produced = lines["es_produccion"] == "t"
    lines["content"] = np.where(
        produced,
        lines["id"].map(entered).fillna(0.0),
        lines["cantidad_inicial"] * lines["id_producto"].map(unit_content),
    )
    lines = lines[lines["content"] > EMPTY].copy()

    lines["received_on"] = pd.to_datetime(lines["fecha_compra"]).dt.normalize()
    lines["expires_on"] = pd.to_datetime(lines["fecha_vencimiento"])

    expired_moves = moves[moves["true_expiry"]].groupby("id_detalle_lote")["cantidad"].sum()
    # Units never opened before expiry leave no movement. Only two lots in
    # the whole history, but they are waste all the same.
    unopened = np.where(produced.loc[lines.index], 0.0, lines["cantidad_restante"] * lines["id_producto"].map(unit_content))
    lines["expired_quantity"] = lines["id"].map(expired_moves).fillna(0.0) + np.where(lines["expires_on"] < cut, unopened, 0.0)
    lines["expired"] = (lines["expired_quantity"] > EXPIRED_TOLERANCE * lines["content"]).astype(int)

    # The outcome is known once the expiry day has passed: real expiries are
    # recorded the day after the expiry date, so `expires_on < cut` is enough.
    lines["outcome_known"] = lines["expires_on"] < cut

    names = catalog.set_index("product_id")
    return pd.DataFrame(
        {
            "lot_id": lines["id"],
            "product_id": lines["id_producto"],
            "product": lines["id_producto"].map(names["name"]),
            "family": lines["id_producto"].map(names["family"]),
            "received_on": lines["received_on"],
            "expires_on": lines["expires_on"],
            "content": lines["content"],
            "expired_quantity": lines["expired_quantity"],
            "expired": np.where(lines["outcome_known"], lines["expired"], np.nan),
        }
    ).reset_index(drop=True)


def daily_usage(lots: pd.DataFrame, moves: pd.DataFrame, cut: pd.Timestamp) -> pd.DataFrame:
    """Usage per product and day, with zeros on days nothing was used."""
    used = moves.groupby(["id_producto", "day"])["usage"].sum()
    frames = []
    for product_id, first_day in lots.groupby("product_id")["received_on"].min().items():
        days = pd.date_range(first_day, cut, freq="D")
        series = used.get(product_id, pd.Series(dtype=float)).reindex(days, fill_value=0.0)
        frames.append(pd.DataFrame({"product_id": product_id, "day": days, "usage": series.to_numpy()}))
    return pd.concat(frames, ignore_index=True)


def usage_averages(usage: pd.DataFrame) -> pd.DataFrame:
    """Average daily usage over the 7 and 28 days before each day.

    Uses yesterday and back, never the same day: the review happens in the
    morning, before that day's sales. Without a full window (the first weeks
    of a product's history) the average is missing, not zero."""
    out = []
    for _, series in usage.groupby("product_id", sort=False):
        series = series.sort_values("day")
        past = series["usage"].shift(1)
        out.append(
            series.assign(
                usage_7d=past.rolling(7, min_periods=7).mean(),
                usage_28d=past.rolling(28, min_periods=28).mean(),
            )
        )
    return pd.concat(out, ignore_index=True)[["product_id", "day", "usage_7d", "usage_28d"]]


def morning_balances(lots: pd.DataFrame, moves: pd.DataFrame, last_day: pd.Timestamp) -> pd.DataFrame:
    """Balance of each lot on the morning of every day of its life."""
    rows = []
    for lot in lots.itertuples(index=False):
        end = min(lot.expires_on, last_day)
        if end < lot.received_on:
            continue
        days = pd.date_range(lot.received_on, end, freq="D")
        rows.append(pd.DataFrame({"lot_id": lot.lot_id, "day": days}))
    grid = pd.concat(rows, ignore_index=True)

    out_per_day = moves.groupby(["id_detalle_lote", "day"])["outflow"].sum().rename("outflow")
    grid = grid.merge(out_per_day, left_on=["lot_id", "day"], right_index=True, how="left")
    grid["outflow"] = grid["outflow"].fillna(0.0)
    # Everything that left before this morning: cumulative outflow up to yesterday.
    grid["out_before"] = grid.groupby("lot_id")["outflow"].cumsum() - grid["outflow"]

    grid = grid.merge(lots[["lot_id", "content"]], on="lot_id")
    grid["balance"] = (grid["content"] - grid["out_before"]).clip(lower=0.0)
    return grid[["lot_id", "day", "balance"]]


def review_rows(lots: pd.DataFrame, balances: pd.DataFrame, averages: pd.DataFrame) -> pd.DataFrame:
    """One row per (open lot, morning) with the raw inputs the API receives."""
    rows = balances[balances["balance"] > EMPTY].merge(lots, on="lot_id")

    # FEFO queue: lots of the same product that go before this one.
    rows = rows.sort_values(["product_id", "day", "expires_on", "received_on", "lot_id"])
    rows["stock_ahead"] = rows.groupby(["product_id", "day"])["balance"].cumsum() - rows["balance"]

    rows = rows.merge(averages, on=["product_id", "day"], how="left")
    return (
        pd.DataFrame(
            {
                "lot_id": rows["lot_id"],
                "product_id": rows["product_id"],
                "product": rows["product"],
                "family": rows["family"],
                "received_on": rows["received_on"].dt.date.astype(str),
                "expires_on": rows["expires_on"].dt.date.astype(str),
                "reviewed_on": rows["day"].dt.date.astype(str),
                "initial_quantity": rows["content"].round(4),
                "remaining_quantity": rows["balance"].round(4),
                "stock_ahead": rows["stock_ahead"].round(4),
                "usage_7d": rows["usage_7d"].round(4),
                "usage_28d": rows["usage_28d"].round(4),
                "expired": rows["expired"],
            }
        )
        .sort_values(["reviewed_on", "product", "lot_id"])
        .reset_index(drop=True)
    )


def content_units(t: dict[str, pd.DataFrame], catalog: pd.DataFrame) -> dict[str, str]:
    """Unit the content of each product is measured in (ml, g, und)."""
    containers = t["existencias"].merge(
        t["detalle_lote"][["id", "id_producto"]].rename(columns={"id": "id_detalle_lote"}), on="id_detalle_lote"
    )
    unit_id = containers.groupby("id_producto")["unidad"].agg(lambda s: s.mode().iloc[0])
    symbols = t["unidad"].set_index("id")["abreviatura"]
    return {pid: symbols[unit_id[pid]] for pid in catalog["product_id"]}


def main(dump: Path) -> None:
    DATA.mkdir(exist_ok=True)
    t = load(dump)
    catalog = perishable_catalog(t)
    units = content_units(t, catalog)
    catalog["unit"] = catalog["product_id"].map(units)

    moves = classify_movements(t, catalog)
    last_day = moves["day"].max()
    cut = last_day + timedelta(days=1)  # "today": the morning after the last recorded day

    lots = lot_table(t, catalog, moves, cut)
    usage = daily_usage(lots, moves, last_day)
    averages = usage_averages(usage)
    balances = morning_balances(lots, moves, cut)
    reviews = review_rows(lots, balances, averages)

    labelled = reviews[reviews["expired"].notna() & (pd.to_datetime(reviews["reviewed_on"]) <= last_day)]
    still_open = reviews[pd.to_datetime(reviews["reviewed_on"]) == cut]

    labelled.to_csv(DATA / "reviews.csv", index=False)
    lots.assign(received_on=lots["received_on"].dt.date.astype(str), expires_on=lots["expires_on"].dt.date.astype(str)).to_csv(
        DATA / "lots.csv", index=False
    )
    usage.assign(day=usage["day"].dt.date.astype(str)).to_csv(DATA / "daily_usage.csv", index=False)
    catalog.to_json(DATA / "catalog.json", orient="records", force_ascii=False, indent=2)
    still_open.drop(columns=["expired"]).to_json(DATA / "open_lots.json", orient="records", force_ascii=False, indent=2)

    known = lots[lots["expired"].notna()]
    print(f"cut: {cut.date()}  (last day with data: {last_day.date()})")
    print(f"perishable products: {len(catalog)}  lots: {len(lots)}  with known outcome: {len(known)}")
    print(f"lots that expired with balance: {known['expired'].mean():.3f}")
    print(f"reviews: {len(labelled)}  of expired lots: {labelled['expired'].mean():.3f}  open lots today: {len(still_open)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dump", type=Path, default=DEFAULT_DUMP)
    main(parser.parse_args().dump)
