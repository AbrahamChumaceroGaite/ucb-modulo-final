"""The data-preparation rules, on frames small enough to check by hand."""

import math

import pandas as pd
import pytest

from build_dataset import classify_movements, morning_balances, review_rows, usage_averages

KINDS = {
    "k-open": "Apertura",
    "k-use": "Consumo venta",
    "k-return": "Devolucion venta",
    "k-expiry": "Vencimiento",
}


def movement_tables(rows):
    """Database-shaped tables for one lot line (`L1`) of product `P1` in container `C1`."""
    return {
        "tipo_movimiento": pd.DataFrame({"id": list(KINDS), "nombre": list(KINDS.values())}),
        "existencias": pd.DataFrame({"id": ["C1"], "id_detalle_lote": ["L1"]}),
        "detalle_lote": pd.DataFrame({"id": ["L1"], "id_producto": ["P1"]}),
        "movimientos": pd.DataFrame(rows, columns=["id_existencia", "cantidad", "fecha_movimiento", "id_tipo_movimiento"]),
    }


CATALOG = pd.DataFrame({"product_id": ["P1"]})


def test_a_returned_sale_thrown_away_is_not_an_expiry():
    moves = classify_movements(
        movement_tables(
            [
                ("C1", 1000.0, "2026-03-02 08:00:00", "k-open"),
                ("C1", 150.0, "2026-03-03 16:00:00", "k-return"),
                ("C1", 150.0, "2026-03-03 16:00:00", "k-expiry"),  # same instant, same amount
                ("C1", 300.0, "2026-03-09 00:30:00", "k-expiry"),  # a real expiry
            ]
        ),
        CATALOG,
    )
    expiries = moves[moves["kind"] == "Vencimiento"].set_index("cantidad")["true_expiry"]
    assert not expiries[150.0]
    assert expiries[300.0]


def test_outflow_signs_follow_the_stock():
    moves = classify_movements(
        movement_tables(
            [
                ("C1", 1000.0, "2026-03-02 08:00:00", "k-open"),
                ("C1", 200.0, "2026-03-02 10:00:00", "k-use"),
                ("C1", 50.0, "2026-03-02 11:00:00", "k-return"),
            ]
        ),
        CATALOG,
    )
    outflow = moves.set_index("kind")["outflow"]
    assert outflow["Apertura"] == 0  # content only moves into a container
    assert outflow["Consumo venta"] == 200
    assert outflow["Devolucion venta"] == -50


def test_usage_averages_look_only_at_yesterday_and_back():
    days = pd.date_range("2026-03-01", periods=10, freq="D")
    usage = pd.DataFrame({"product_id": "P1", "day": days, "usage": [float(i) for i in range(10)]})
    averages = usage_averages(usage).set_index("day")

    # Day 8 (index 7): mean of days 0..6, never including day 7 itself.
    assert averages.loc[days[7], "usage_7d"] == pytest.approx(3.0)
    # Not enough history yet: missing, not zero.
    assert math.isnan(averages.loc[days[6], "usage_7d"])
    assert math.isnan(averages.loc[days[9], "usage_28d"])


def test_morning_balance_subtracts_only_what_left_before_that_morning():
    lots = pd.DataFrame(
        {
            "lot_id": ["L1"],
            "content": [1000.0],
            "received_on": [pd.Timestamp("2026-03-02")],
            "expires_on": [pd.Timestamp("2026-03-04")],
        }
    )
    moves = pd.DataFrame(
        {
            "id_detalle_lote": ["L1", "L1"],
            "day": [pd.Timestamp("2026-03-02"), pd.Timestamp("2026-03-03")],
            "outflow": [300.0, 200.0],
        }
    )
    balances = morning_balances(lots, moves, last_day=pd.Timestamp("2026-03-10")).set_index("day")["balance"]
    assert balances.tolist() == [1000.0, 700.0, 500.0]


def test_stock_ahead_is_what_expires_earlier_in_the_same_product():
    lots = pd.DataFrame(
        {
            "lot_id": ["early", "late"],
            "product_id": ["P1", "P1"],
            "product": ["Leche", "Leche"],
            "family": ["dairy", "dairy"],
            "received_on": [pd.Timestamp("2026-03-01"), pd.Timestamp("2026-03-02")],
            "expires_on": [pd.Timestamp("2026-03-08"), pd.Timestamp("2026-03-10")],
            "content": [1000.0, 1000.0],
            "expired": [0.0, 1.0],
        }
    )
    day = pd.Timestamp("2026-03-03")
    balances = pd.DataFrame({"lot_id": ["early", "late"], "day": [day, day], "balance": [400.0, 1000.0]})
    averages = pd.DataFrame({"product_id": ["P1"], "day": [day], "usage_7d": [100.0], "usage_28d": [90.0]})

    rows = review_rows(lots, balances, averages).set_index("lot_id")
    assert rows.loc["early", "stock_ahead"] == 0
    assert rows.loc["late", "stock_ahead"] == 400


def test_an_empty_lot_is_not_reviewed():
    lots = pd.DataFrame(
        {
            "lot_id": ["L1"],
            "product_id": ["P1"],
            "product": ["Leche"],
            "family": ["dairy"],
            "received_on": [pd.Timestamp("2026-03-01")],
            "expires_on": [pd.Timestamp("2026-03-08")],
            "content": [1000.0],
            "expired": [0.0],
        }
    )
    day = pd.Timestamp("2026-03-03")
    balances = pd.DataFrame({"lot_id": ["L1"], "day": [day], "balance": [0.0]})
    averages = pd.DataFrame({"product_id": ["P1"], "day": [day], "usage_7d": [100.0], "usage_28d": [90.0]})
    assert review_rows(lots, balances, averages).empty
