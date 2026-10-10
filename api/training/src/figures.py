"""Report figures. Axis labels and titles are in Spanish: they go in the report."""

from __future__ import annotations

import lightgbm as lgb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.ticker import FuncFormatter
from sklearn.metrics import average_precision_score, confusion_matrix, precision_recall_curve, precision_score, recall_score

from calendar_bo import VACATIONS
from features import FEATURES
from paths import DATA, FIGURES

COLOR = {
    "model": "#6B3E26",
    "rule": "#C8893B",
    "logistic": "#5B6C80",
    "fefo": "#9E9E9E",
    "positive": "#B23A2E",
    "negative": "#4F7C5A",
}

LABELS = {
    "days_to_expiry": "Días para vencer",
    "age_days": "Edad del lote (días)",
    "shelf_life_days": "Vida útil (días)",
    "remaining_share": "Fracción que queda",
    "usage_7d": "Consumo diario, 7 días",
    "usage_28d": "Consumo diario, 28 días",
    "usage_trend": "Tendencia del consumo",
    "coverage_days": "Días de cobertura",
    "slack_days": "Holgura (días)",
    "share_ahead_fefo": "Fracción por delante en FEFO",
    "class_share_until_expiry": "Días de clases hasta vencer",
    "class_share_last_7d": "Días de clases, última semana",
    "weekday": "Día de la semana",
    "family_dairy": "Familia: lácteos",
    "family_cold_cuts": "Familia: fiambres",
    "family_bakery": "Familia: panadería",
    "family_produce": "Familia: frutas y verduras",
    "family_eggs": "Familia: huevos",
}

# The series drawn in figure 2: a product with daily use all year round.
SEASONALITY_PRODUCT = "Leche Pil 1 L"

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 10,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.titleweight": "bold",
        "figure.dpi": 150,
        "savefig.bbox": "tight",
    }
)


def spanish_number(value: float, decimals: int = 0) -> str:
    """Dot for thousands, comma for decimals."""
    text = f"{value:,.{decimals}f}"
    return text.replace(",", "_").replace(".", ",").replace("_", ".")


def _spanish_axis(ax, axis: str = "y", decimals: int = 1) -> None:
    formatter = FuncFormatter(lambda v, _: spanish_number(v, decimals))
    (ax.yaxis if axis == "y" else ax.xaxis).set_major_formatter(formatter)


def _save(fig, name: str) -> None:
    fig.savefig(FIGURES / name)
    plt.close(fig)


def diagnostics(reviews: pd.DataFrame, lots: pd.DataFrame) -> None:
    usage = pd.read_csv(DATA / "daily_usage.csv", parse_dates=["day"])
    catalog = pd.read_json(DATA / "catalog.json")

    # 1. Target distribution.
    fig, ax = plt.subplots(figsize=(6, 3.4))
    counts = reviews["expired"].value_counts().sort_index()
    bars = ax.bar(["Se consumió a tiempo", "Venció con saldo"], counts.values, color=[COLOR["negative"], COLOR["positive"]])
    for bar, value in zip(bars, counts.values, strict=True):
        share = spanish_number(value / counts.sum() * 100, 1)
        center = bar.get_x() + bar.get_width() / 2
        ax.annotate(f"{spanish_number(value)}\n({share} %)", (center, value), ha="center", va="bottom", fontsize=9)
    ax.set_ylabel("Revisiones de lote")
    ax.set_title("Distribución de la variable objetivo")
    ax.set_ylim(0, counts.max() * 1.25)
    _save(fig, "fig1_target_distribution.png")

    # 2. Daily usage of one product: weekly cycle and university vacations.
    product_id = catalog.loc[catalog["name"] == SEASONALITY_PRODUCT, "product_id"].iloc[0]
    series = usage[usage["product_id"] == product_id].set_index("day")["usage"] / 1000  # ml -> litres
    fig, ax = plt.subplots(figsize=(10, 3.4))
    ax.plot(series.index, series.values, color="#C9B8A6", linewidth=0.5, label="Diario")
    ax.plot(series.index, series.rolling(7, center=True).mean(), color=COLOR["model"], linewidth=1.4, label="Media móvil de 7 días")
    for year in sorted(series.index.year.unique()):
        for start, end in VACATIONS:
            band_start, band_end = pd.Timestamp(f"{year}-{start}"), pd.Timestamp(f"{year}-{end}")
            if band_end >= series.index.min() and band_start <= series.index.max():
                ax.axvspan(max(band_start, series.index.min()), min(band_end, series.index.max()), color="#E8E1D9", zorder=0)
    ax.set_ylabel("Litros consumidos")
    ax.set_title(f"Consumo diario de {SEASONALITY_PRODUCT}: ciclo semanal y vacaciones (franjas)")
    ax.legend(frameon=False, loc="upper left")
    _save(fig, "fig2_usage_seasonality.png")

    # 3. Monthly waste rate of the current process, all lots with a known outcome.
    known = lots[lots["expired"].notna()].copy()
    known["month"] = pd.to_datetime(known["received_on"]).dt.to_period("M").dt.to_timestamp()
    monthly = known.groupby("month")["expired"].mean() * 100
    overall = known["expired"].mean() * 100
    fig, ax = plt.subplots(figsize=(10, 3.4))
    ax.bar(monthly.index, monthly.values, width=20, color=COLOR["rule"])
    ax.axhline(overall, color=COLOR["positive"], linestyle="--", linewidth=1, label=f"Promedio: {spanish_number(overall, 1)} %")
    ax.legend(frameon=False, loc="upper right")
    ax.set_ylabel("% de lotes que vencen")
    ax.set_title("Lotes que vencen con saldo, por mes de ingreso (práctica actual)")
    _save(fig, "fig3_waste_rate.png")

    # 4. Missing usage averages, only at the start of each product's history.
    first_purchase = pd.to_datetime(lots.groupby("product_id")["received_on"].min())
    week = (pd.to_datetime(reviews["reviewed_on"]) - reviews["product_id"].map(first_purchase)).dt.days // 7 + 1
    missing = reviews[["usage_7d", "usage_28d"]].isna().groupby(week).mean().loc[1:8] * 100
    fig, ax = plt.subplots(figsize=(8, 3.0))
    x = np.arange(len(missing))
    ax.bar(x - 0.2, missing["usage_7d"], width=0.4, color=COLOR["rule"], label="Consumo de 7 días")
    ax.bar(x + 0.2, missing["usage_28d"], width=0.4, color=COLOR["model"], label="Consumo de 28 días")
    ax.set_xticks(x, [f"Sem. {i}" for i in missing.index])
    ax.set_ylabel("% de revisiones sin dato")
    ax.set_title("Faltantes de consumo: solo al inicio de la historia de cada producto")
    ax.legend(frameon=False, loc="upper right")
    _save(fig, "fig4_missing_usage.png")


def results(y: np.ndarray, probs: dict, preds: dict, model: lgb.LGBMClassifier, errors: pd.DataFrame) -> None:
    # 5. Precision-recall curves on test.
    fig, ax = plt.subplots(figsize=(6, 4.2))
    for key, label in (("model", "LightGBM"), ("logistic", "Regresión logística")):
        p, r, _ = precision_recall_curve(y, probs[key])
        ax.plot(r, p, color=COLOR[key], label=f"{label} (PR-AUC {spanish_number(average_precision_score(y, probs[key]), 3)})")
    for key, label, marker in (("rule", "Regla de cobertura", "s"), ("model", "LightGBM con umbral", "o")):
        point = (recall_score(y, preds[key]), precision_score(y, preds[key]))
        ax.scatter(*point, color=COLOR[key], marker=marker, s=50, zorder=3, label=label)
    ax.axhline(y.mean(), color=COLOR["fefo"], linestyle=":", linewidth=1, label=f"Azar ({spanish_number(y.mean() * 100, 1)} % positivos)")
    ax.set_xlabel("Recall (lotes que vencen detectados)")
    ax.set_ylabel("Precisión (avisos que eran ciertos)")
    ax.set_title("Curva precisión-recall en prueba")
    _spanish_axis(ax, "x")
    _spanish_axis(ax, "y")
    ax.legend(frameon=False, fontsize=8, loc="lower left")
    _save(fig, "fig5_pr_curve.png")

    # 6. Confusion matrices: rule vs model.
    fig, axes = plt.subplots(1, 2, figsize=(8, 3.4))
    for ax, (key, title) in zip(axes, (("rule", "Regla de cobertura"), ("model", "LightGBM")), strict=True):
        matrix = confusion_matrix(y, preds[key], labels=[0, 1])
        ax.imshow(matrix, cmap="Oranges")
        for (i, j), value in np.ndenumerate(matrix):
            ink = "white" if value > matrix.max() / 2 else "black"
            ax.text(j, i, spanish_number(value), ha="center", va="center", fontsize=11, color=ink)
        ax.set_xticks([0, 1], ["Sin riesgo", "En riesgo"])
        ax.set_yticks([0, 1], ["Se consumió", "Venció"])
        ax.set_xlabel("Predicción")
        ax.set_title(title)
    axes[0].set_ylabel("Realidad")
    _save(fig, "fig6_confusion_matrices.png")

    # 7. Feature importance by gain.
    importance = pd.Series(model.booster_.feature_importance("gain"), index=FEATURES)
    importance = (importance / importance.sum()).sort_values()
    fig, ax = plt.subplots(figsize=(6.5, 4.6))
    ax.barh([LABELS[name] for name in importance.index], importance.values * 100, color=COLOR["model"])
    ax.set_xlabel("% de la ganancia total")
    ax.set_title("Importancia de variables (LightGBM)")
    _save(fig, "fig7_feature_importance.png")

    # 8. Where expiring lots are missed, by days to expiry.
    by_days = errors.groupby("days_band", observed=True)[["rule_false_negative", "model_false_negative"]].sum()
    fig, ax = plt.subplots(figsize=(7, 3.4))
    positions = np.arange(len(by_days))
    ax.bar(positions - 0.2, by_days["rule_false_negative"], width=0.4, color=COLOR["rule"], label="Regla de cobertura")
    ax.bar(positions + 0.2, by_days["model_false_negative"], width=0.4, color=COLOR["model"], label="LightGBM")
    ax.set_xticks(positions, by_days.index.astype(str))
    ax.set_xlabel("Días para vencer en la revisión")
    ax.set_ylabel("Falsos negativos")
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.set_title("Dónde se escapan los lotes que vencen")
    ax.legend(frameon=False)
    _save(fig, "fig8_errors_by_days.png")
