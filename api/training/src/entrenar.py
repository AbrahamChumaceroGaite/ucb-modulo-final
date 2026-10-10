"""Training, validation and export of the lot-expiry risk model.

Run after `generar_datos.py`. Everything is deterministic (fixed seeds,
single thread for LightGBM), so running it twice gives the same artefacts.

Steps:
1. Build features from the raw review rows (same code the API mirrors).
2. Split by the lot's entry date into train / validation / test, with a
   22-day embargo between them (longest shelf life in the catalog plus one),
   so no lot or outcome crosses partitions. Random k-fold is not used: the
   unit has temporal dependence and k-fold would predict the past with the
   future.
3. Compare four methods on the SAME test rows: current FEFO practice, the
   coverage rule, logistic regression and LightGBM.
4. Thresholds are chosen on validation only (max precision with recall >= 0.85).
   The test set is evaluated once, at the end.
5. Export the model as JSON for the NestJS API plus a parity fixture.
"""

from __future__ import annotations

import json
import math
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import lightgbm as lgb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.stats import binomtest
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

import calendario
from caracteristicas import CATEGORIAS, VARIABLES, construir_caracteristicas, regla_de_cobertura
from generar_datos import CORTE, SEMILLA

RAIZ = Path(__file__).resolve().parents[1]
DATOS = RAIZ / "datos"
ARTEFACTOS = RAIZ / "artefactos"
FIGURAS = RAIZ / "figuras"
RESULTADOS = RAIZ / "resultados"

VERSION_MODELO = "1.0.0"
RECALL_OBJETIVO = 0.85
EMBARGO = timedelta(days=22)

PARTICIONES = {
    "entrenamiento": (date(2025, 4, 1), date(2026, 1, 31)),
    "validacion": (date(2026, 1, 31) + EMBARGO, date(2026, 5, 31)),
    "prueba": (date(2026, 5, 31) + EMBARGO, date(2026, 9, 10)),
}

COLUMNAS_ENTRADA = [
    "categoria",
    "fecha_ingreso",
    "fecha_vencimiento",
    "fecha_revision",
    "cantidad_inicial",
    "cantidad_restante",
    "stock_por_delante",
    "consumo_7d",
    "consumo_28d",
]

COLOR = {
    "modelo": "#6B3E26",
    "regla": "#C8893B",
    "logistica": "#5B6C80",
    "fefo": "#9E9E9E",
    "positivo": "#B23A2E",
    "negativo": "#4F7C5A",
}

# Readable names for the report. Same order as VARIABLES.
ETIQUETAS = {
    "dias_para_vencer": "Días para vencer",
    "edad_dias": "Edad del lote (días)",
    "vida_util_dias": "Vida útil (días)",
    "porcentaje_restante": "Fracción que queda",
    "consumo_7d": "Consumo diario, 7 días",
    "consumo_28d": "Consumo diario, 28 días",
    "tendencia_consumo": "Tendencia del consumo",
    "dias_cobertura": "Días de cobertura",
    "holgura_dias": "Holgura (días)",
    "fraccion_por_delante": "Fracción por delante en FEFO",
    "proporcion_clases_restante": "Días de clases hasta vencer",
    "proporcion_clases_7d": "Días de clases, última semana",
    "dia_semana": "Día de la semana",
    "cat_lacteos": "Categoría: lácteos",
    "cat_fiambres": "Categoría: fiambres",
    "cat_panaderia": "Categoría: panadería",
    "cat_frutas": "Categoría: frutas",
    "cat_huevos": "Categoría: huevos",
}


def es(valor: float, decimales: int = 0) -> str:
    """Spanish number format: dot for thousands, comma for decimals."""
    texto = f"{valor:,.{decimales}f}"
    return texto.replace(",", "_").replace(".", ",").replace("_", ".")


def eje_es(ax, eje: str = "y", decimales: int = 1) -> None:
    from matplotlib.ticker import FuncFormatter

    formato = FuncFormatter(lambda v, _: es(v, decimales))
    (ax.yaxis if eje == "y" else ax.xaxis).set_major_formatter(formato)


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


# ----------------------------------------------------------------- data


def entrada_de(fila: dict) -> dict:
    return {k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in fila.items()}


def cargar() -> pd.DataFrame:
    revisiones = pd.read_csv(DATOS / "revisiones.csv")
    revisiones = revisiones[revisiones["vencido"].notna()].copy()
    revisiones["vencido"] = revisiones["vencido"].astype(bool).astype(int)

    matriz = [
        construir_caracteristicas(entrada_de(fila))
        for fila in revisiones[COLUMNAS_ENTRADA].to_dict("records")
    ]
    caracteristicas = pd.DataFrame(matriz, columns=VARIABLES, index=revisiones.index)
    # The two consumption averages are both raw inputs and features (the
    # feature is the input unchanged), so they are kept once.
    nuevas = [c for c in VARIABLES if c not in revisiones.columns]
    assert np.allclose(caracteristicas["consumo_7d"], revisiones["consumo_7d"], equal_nan=True)
    datos = pd.concat([revisiones, caracteristicas[nuevas]], axis=1)

    ingreso = pd.to_datetime(datos["fecha_ingreso"]).dt.date
    cierre = pd.to_datetime(datos["fecha_cierre"]).dt.date
    datos["particion"] = None
    for nombre, (desde, hasta) in PARTICIONES.items():
        dentro = (ingreso >= desde) & (ingreso <= hasta)
        if nombre == "prueba":
            # Only lots whose outcome is already known at the cut.
            dentro &= cierre <= CORTE
        datos.loc[dentro, "particion"] = nombre
    return datos


# -------------------------------------------------------------- metrics


def metricas(y: np.ndarray, pred: np.ndarray, prob: np.ndarray | None = None) -> dict:
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    resultado = {
        "recall": float(recall_score(y, pred, zero_division=0)),
        "precision": float(precision_score(y, pred, zero_division=0)),
        "accuracy": float(accuracy_score(y, pred)),
        "f1": float(f1_score(y, pred, zero_division=0)),
        "prAuc": None if prob is None else float(average_precision_score(y, prob)),
        "verdaderosPositivos": int(tp),
        "falsosPositivos": int(fp),
        "falsosNegativos": int(fn),
        "verdaderosNegativos": int(tn),
    }
    return resultado


def umbral_por_recall(y: np.ndarray, prob: np.ndarray, objetivo: float) -> float:
    """Highest-precision threshold whose recall still reaches the target."""
    precision, recall, umbrales = precision_recall_curve(y, prob)
    candidatos = [
        (p, u) for p, r, u in zip(precision[:-1], recall[:-1], umbrales) if r >= objetivo
    ]
    if not candidatos:
        return float(umbrales.min())
    mejor_precision = max(p for p, _ in candidatos)
    # Among ties in precision, the highest threshold (fewest alarms).
    return float(max(u for p, u in candidatos if p == mejor_precision))


def aviso_anticipado(datos: pd.DataFrame, pred: np.ndarray, dias: int = 2) -> float:
    """Share of expired lots flagged at least once with >= `dias` days left.

    This is the business question: was there time to do something?"""
    marco = datos.assign(pred=pred)
    vencidos = marco[marco["vencido"] == 1]
    if vencidos.empty:
        return float("nan")
    avisados = vencidos[(vencidos["pred"] == 1) & (vencidos["dias_para_vencer"] >= dias)]
    return avisados["id_lote"].nunique() / vencidos["id_lote"].nunique()


def mcnemar(y: np.ndarray, a: np.ndarray, b: np.ndarray) -> dict:
    acierta_a = a == y
    acierta_b = b == y
    solo_a = int(np.sum(acierta_a & ~acierta_b))
    solo_b = int(np.sum(~acierta_a & acierta_b))
    n = solo_a + solo_b
    p = 1.0 if n == 0 else float(binomtest(solo_a, n, 0.5).pvalue)
    return {"soloModelo": solo_a, "soloRegla": solo_b, "pValor": p}


def bootstrap_por_lote(
    datos: pd.DataFrame, y: np.ndarray, a: np.ndarray, b: np.ndarray, repeticiones: int = 2000
) -> dict:
    """95 % interval of recall(a) - recall(b), resampling whole lots.

    Rows of the same lot are correlated, so resampling rows would understate
    the uncertainty."""
    rng = np.random.default_rng(SEMILLA)
    marco = pd.DataFrame({"lote": datos["id_lote"].values, "y": y, "a": a, "b": b})
    grupos = [g for _, g in marco.groupby("lote")]
    diferencias = []
    for _ in range(repeticiones):
        muestra = pd.concat([grupos[i] for i in rng.integers(0, len(grupos), len(grupos))])
        positivos = muestra[muestra["y"] == 1]
        if positivos.empty:
            continue
        diferencias.append(positivos["a"].mean() - positivos["b"].mean())
    bajo, alto = np.percentile(diferencias, [2.5, 97.5])
    return {"diferenciaRecall": float(np.mean(diferencias)), "ic95": [float(bajo), float(alto)]}


# --------------------------------------------------------------- models


def entrenar_logistica(x: pd.DataFrame, y: np.ndarray) -> Pipeline:
    modelo = Pipeline(
        [
            ("imputar", SimpleImputer(strategy="median")),
            ("escalar", StandardScaler()),
            ("clasificar", LogisticRegression(class_weight="balanced", max_iter=5000, random_state=SEMILLA)),
        ]
    )
    return modelo.fit(x, y)


def entrenar_lightgbm(
    x_ent: pd.DataFrame, y_ent: np.ndarray, x_val: pd.DataFrame, y_val: np.ndarray
) -> tuple[lgb.LGBMClassifier, list[dict]]:
    rejilla = [
        {"num_leaves": hojas, "learning_rate": tasa, "min_child_samples": minimo}
        for hojas in (7, 15, 31)
        for tasa in (0.03, 0.08)
        for minimo in (20, 60)
    ]
    historial = []
    mejor = None
    for parametros in rejilla:
        modelo = lgb.LGBMClassifier(
            n_estimators=3000,
            subsample=0.8,
            subsample_freq=1,
            colsample_bytree=0.8,
            reg_lambda=1.0,
            random_state=SEMILLA,
            deterministic=True,
            force_row_wise=True,
            n_jobs=1,
            verbose=-1,
            **parametros,
        )
        modelo.fit(
            x_ent,
            y_ent,
            eval_X=(x_val,),
            eval_y=(y_val,),
            eval_metric="binary_logloss",
            callbacks=[lgb.early_stopping(100, verbose=False)],
        )
        prob = modelo.predict_proba(x_val)[:, 1]
        puntaje = average_precision_score(y_val, prob)
        historial.append({**parametros, "arboles": int(modelo.best_iteration_), "prAucValidacion": float(puntaje)})
        if mejor is None or puntaje > mejor[0]:
            mejor = (puntaje, modelo)
    assert mejor is not None
    return mejor[1], historial


# --------------------------------------------------------------- figures


def figuras_diagnostico(datos: pd.DataFrame) -> None:
    consumo = pd.read_csv(DATOS / "consumo_diario.csv", parse_dates=["fecha"])
    lotes = pd.read_csv(DATOS / "lotes.csv", parse_dates=["fecha_ingreso"])
    # Only lots whose outcome was known at the cut.
    lotes = lotes[pd.to_datetime(lotes["fecha_cierre"]).dt.date <= CORTE].copy()

    # Figure 1: target distribution.
    fig, ax = plt.subplots(figsize=(6, 3.4))
    conteo = datos["vencido"].value_counts().sort_index()
    barras = ax.bar(["Se consumió a tiempo", "Venció con saldo"], conteo.values, color=[COLOR["negativo"], COLOR["positivo"]])
    for barra, valor in zip(barras, conteo.values):
        ax.annotate(f"{es(valor)}\n({es(valor / conteo.sum() * 100, 1)} %)", (barra.get_x() + barra.get_width() / 2, valor), ha="center", va="bottom", fontsize=9)
    ax.set_ylabel("Revisiones de lote")
    ax.set_title("Distribución de la variable objetivo")
    ax.set_ylim(0, conteo.max() * 1.25)
    fig.savefig(FIGURAS / "fig1_distribucion_objetivo.png")
    plt.close(fig)

    # Figure 2: consumption series with weekly and academic seasonality.
    consumo = consumo[consumo["fecha"].dt.date <= CORTE]
    serie = consumo[consumo["codigo_insumo"] == "LEC-ENT"].set_index("fecha")["servido"]
    fig, ax = plt.subplots(figsize=(9, 3.4))
    ax.plot(serie.index, serie.values, color="#C9B8A6", linewidth=0.7, label="Diario")
    ax.plot(serie.index, serie.rolling(7, center=True).mean(), color=COLOR["modelo"], linewidth=1.6, label="Media móvil de 7 días")
    for anio in (2025, 2026):
        for desde, hasta in calendario.VACACIONES:
            ini = pd.Timestamp(f"{anio}-{desde}")
            fin = pd.Timestamp(f"{anio}-{hasta}")
            if fin >= serie.index.min() and ini <= serie.index.max():
                ax.axvspan(max(ini, serie.index.min()), min(fin, serie.index.max()), color="#E8E1D9", zorder=0)
    ax.set_ylabel("Litros consumidos")
    ax.set_title("Consumo de leche entera: ciclo semanal y vacaciones (franjas)")
    ax.legend(frameon=False, loc="upper left")
    fig.savefig(FIGURAS / "fig2_serie_estacionalidad.png")
    plt.close(fig)

    # Figure 3: waste rate of the current process by month.
    lotes["mes"] = lotes["fecha_ingreso"].dt.to_period("M").dt.to_timestamp()
    mensual = lotes.groupby("mes").agg(vencidos=("vencido", "mean"))
    tasa_global = lotes["vencido"].mean()
    fig, ax = plt.subplots(figsize=(9, 3.4))
    ax.bar(mensual.index, mensual["vencidos"] * 100, width=20, color=COLOR["regla"])
    ax.axhline(tasa_global * 100, color=COLOR["positivo"], linestyle="--", linewidth=1, label=f"Promedio: {es(tasa_global * 100, 1)} %")
    ax.legend(frameon=False, loc="upper right")
    ax.set_ylabel("% de lotes que vencen")
    ax.set_title("Tasa de vencimiento con la práctica actual (FEFO a ojo)")
    fig.savefig(FIGURAS / "fig3_tasa_error_proceso.png")
    plt.close(fig)

    # Figure 4: share of reviews without consumption data, by week since the
    # start of the history. The other raw inputs are never missing, and after
    # the first weeks neither are these, so only the opening is drawn.
    revisado = pd.to_datetime(datos["fecha_revision"])
    semana = ((revisado - revisado.min()).dt.days // 7) + 1
    por_semana = datos[["consumo_7d", "consumo_28d"]].isna().groupby(semana).mean() * 100
    por_semana = por_semana.loc[1:10]
    fig, ax = plt.subplots(figsize=(9, 3.0))
    x = np.arange(len(por_semana))
    ax.bar(x - 0.2, por_semana["consumo_7d"], width=0.4, color=COLOR["regla"], label="Consumo de 7 días")
    ax.bar(x + 0.2, por_semana["consumo_28d"], width=0.4, color=COLOR["modelo"], label="Consumo de 28 días")
    ax.set_xticks(x, [f"Sem. {i}" for i in por_semana.index])
    ax.set_ylabel("% de revisiones sin dato")
    ax.set_title("Faltantes en el consumo reciente, primeras diez semanas")
    ax.legend(frameon=False, loc="upper right")
    fig.savefig(FIGURAS / "fig4_matriz_faltantes.png")
    plt.close(fig)


def figuras_resultados(y: np.ndarray, probs: dict, preds: dict, modelo: lgb.LGBMClassifier, errores: pd.DataFrame) -> None:
    # PR curves on test.
    fig, ax = plt.subplots(figsize=(6, 4.2))
    for nombre, etiqueta in (("modelo", "LightGBM"), ("logistica", "Regresión logística")):
        p, r, _ = precision_recall_curve(y, probs[nombre])
        ax.plot(r, p, color=COLOR[nombre], label=f"{etiqueta} (PR-AUC {es(average_precision_score(y, probs[nombre]), 3)})")
    for nombre, etiqueta, marcador in (("regla", "Regla de cobertura", "s"), ("modelo", "LightGBM con umbral", "o")):
        ax.scatter(recall_score(y, preds[nombre]), precision_score(y, preds[nombre]), color=COLOR[nombre], marker=marcador, s=50, zorder=3, label=etiqueta)
    ax.axhline(y.mean(), color=COLOR["fefo"], linestyle=":", linewidth=1, label=f"Azar ({es(y.mean() * 100, 1)} % positivos)")
    ax.set_xlabel("Recall (lotes que vencen detectados)")
    ax.set_ylabel("Precisión (avisos que eran ciertos)")
    ax.set_title("Curva precisión-recall en prueba")
    eje_es(ax, "x")
    eje_es(ax, "y")
    ax.legend(frameon=False, fontsize=8, loc="lower left")
    fig.savefig(FIGURAS / "fig5_curva_pr.png")
    plt.close(fig)

    # Confusion matrices: rule vs model.
    fig, ejes = plt.subplots(1, 2, figsize=(8, 3.4))
    for ax, (nombre, titulo) in zip(ejes, (("regla", "Regla de cobertura"), ("modelo", "LightGBM"))):
        matriz = confusion_matrix(y, preds[nombre], labels=[0, 1])
        ax.imshow(matriz, cmap="Oranges")
        for (i, j), valor in np.ndenumerate(matriz):
            claro = valor > matriz.max() / 2
            ax.text(j, i, es(valor), ha="center", va="center", fontsize=11, color="white" if claro else "black")
        ax.set_xticks([0, 1], ["Sin riesgo", "En riesgo"])
        ax.set_yticks([0, 1], ["Se consumió", "Venció"])
        ax.set_xlabel("Predicción")
        ax.set_title(titulo)
    ejes[0].set_ylabel("Realidad")
    fig.savefig(FIGURAS / "fig6_matrices_confusion.png")
    plt.close(fig)

    # Feature importance (gain).
    importancia = pd.Series(modelo.booster_.feature_importance("gain"), index=VARIABLES)
    importancia = (importancia / importancia.sum()).sort_values()
    fig, ax = plt.subplots(figsize=(6.5, 4.6))
    ax.barh([ETIQUETAS[v] for v in importancia.index], importancia.values * 100, color=COLOR["modelo"])
    ax.set_xlabel("% de la ganancia total")
    ax.set_title("Importancia de variables (LightGBM)")
    fig.savefig(FIGURAS / "fig7_importancia.png")
    plt.close(fig)

    # Error analysis by days to expiry.
    tramos = errores.groupby("tramo_dias", observed=True)[["falso_negativo_regla", "falso_negativo_modelo"]].sum()
    fig, ax = plt.subplots(figsize=(7, 3.4))
    posiciones = np.arange(len(tramos))
    ax.bar(posiciones - 0.2, tramos["falso_negativo_regla"], width=0.4, color=COLOR["regla"], label="Regla de cobertura")
    ax.bar(posiciones + 0.2, tramos["falso_negativo_modelo"], width=0.4, color=COLOR["modelo"], label="LightGBM")
    ax.set_xticks(posiciones, tramos.index.astype(str))
    ax.set_xlabel("Días para vencer en la revisión")
    ax.set_ylabel("Falsos negativos")
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.set_title("Dónde se escapan los lotes que vencen")
    ax.legend(frameon=False)
    fig.savefig(FIGURAS / "fig8_errores_por_dias.png")
    plt.close(fig)


# ------------------------------------------------------------------ export


def exportar_modelo(modelo: lgb.LGBMClassifier, umbral: float, resumen: dict) -> None:
    volcado = modelo.booster_.dump_model()
    catalogo = json.loads((DATOS / "catalogo_insumos.json").read_text(encoding="utf-8"))
    artefacto = {
        "version": VERSION_MODELO,
        "entrenadoEl": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "semilla": SEMILLA,
        "variables": VARIABLES,
        "categorias": CATEGORIAS,
        "umbral": umbral,
        "recallObjetivo": RECALL_OBJETIVO,
        "coberturaMaxima": 999.0,
        "insumos": catalogo,
        "metricas": resumen,
        "lightgbm": {
            "objetivo": volcado["objective"],
            "numArboles": len(volcado["tree_info"]),
            "arboles": [arbol["tree_structure"] for arbol in volcado["tree_info"]],
        },
    }
    (ARTEFACTOS / "modelo_riesgo.json").write_text(json.dumps(artefacto, ensure_ascii=False), encoding="utf-8")
    modelo.booster_.save_model(str(ARTEFACTOS / "modelo_lightgbm.txt"))


def exportar_paridad(datos: pd.DataFrame, modelo: lgb.LGBMClassifier) -> None:
    """Raw inputs + expected features + expected probability, for Jest.

    Parity is about computing the same thing, not about generalisation, so
    rows come from every partition. Rows with missing consumption (only in
    the first weeks of history) are added on purpose: that is where a port is
    most likely to diverge."""
    muestra = datos[datos["particion"] == "prueba"].sample(n=400, random_state=SEMILLA)
    con_faltantes = datos[datos["consumo_28d"].isna() | datos["consumo_7d"].isna()]
    con_faltantes = con_faltantes.sample(n=min(40, len(con_faltantes)), random_state=SEMILLA)
    muestra = pd.concat([muestra, con_faltantes]).drop_duplicates(subset=["id_lote", "fecha_revision"])
    prob = modelo.booster_.predict(muestra[VARIABLES])
    casos = []
    for (_, fila), p in zip(muestra.iterrows(), prob):
        entrada = entrada_de({c: fila[c] for c in COLUMNAS_ENTRADA})
        casos.append(
            {
                "entrada": entrada,
                "caracteristicas": [None if math.isnan(v) else v for v in fila[VARIABLES].astype(float)],
                "probabilidad": float(p),
                "regla": int(fila["pred_regla"]),
            }
        )
    (ARTEFACTOS / "paridad.json").write_text(json.dumps(casos, ensure_ascii=False), encoding="utf-8")


# -------------------------------------------------------------------- main


def principal() -> None:
    for carpeta in (ARTEFACTOS, FIGURAS, RESULTADOS):
        carpeta.mkdir(exist_ok=True)
    calendario.exportar(ARTEFACTOS / "calendario.json")

    datos = cargar()
    datos["pred_regla"] = [regla_de_cobertura(list(f)) for f in datos[VARIABLES].itertuples(index=False)]
    figuras_diagnostico(datos)

    ent = datos[datos["particion"] == "entrenamiento"]
    val = datos[datos["particion"] == "validacion"]
    pru = datos[datos["particion"] == "prueba"]
    y_ent, y_val, y_pru = (d["vencido"].to_numpy() for d in (ent, val, pru))

    logistica = entrenar_logistica(ent[VARIABLES], y_ent)
    lgbm, historial = entrenar_lightgbm(ent[VARIABLES], y_ent, val[VARIABLES], y_val)

    umbral_log = umbral_por_recall(y_val, logistica.predict_proba(val[VARIABLES])[:, 1], RECALL_OBJETIVO)
    umbral_lgb = umbral_por_recall(y_val, lgbm.predict_proba(val[VARIABLES])[:, 1], RECALL_OBJETIVO)

    probs = {
        "logistica": logistica.predict_proba(pru[VARIABLES])[:, 1],
        "modelo": lgbm.predict_proba(pru[VARIABLES])[:, 1],
    }
    preds = {
        "fefo": np.zeros_like(y_pru),
        "regla": pru["pred_regla"].to_numpy(),
        "logistica": (probs["logistica"] >= umbral_log).astype(int),
        "modelo": (probs["modelo"] >= umbral_lgb).astype(int),
    }

    resultados = {
        nombre: {
            **metricas(y_pru, pred, probs.get(nombre)),
            "avisoAnticipado2Dias": aviso_anticipado(pru, pred),
        }
        for nombre, pred in preds.items()
    }
    resultados["logistica"]["umbral"] = umbral_log
    resultados["modelo"]["umbral"] = umbral_lgb

    validacion = {
        "regla": metricas(y_val, val["pred_regla"].to_numpy()),
        "logistica": metricas(y_val, (logistica.predict_proba(val[VARIABLES])[:, 1] >= umbral_log).astype(int)),
        "modelo": metricas(y_val, (lgbm.predict_proba(val[VARIABLES])[:, 1] >= umbral_lgb).astype(int)),
    }

    comparacion = {
        "mcnemarModeloVsRegla": mcnemar(y_pru, preds["modelo"], preds["regla"]),
        "bootstrapRecallModeloMenosRegla": bootstrap_por_lote(pru, y_pru, preds["modelo"], preds["regla"]),
    }

    errores = pru.assign(
        falso_negativo_regla=(y_pru == 1) & (preds["regla"] == 0),
        falso_negativo_modelo=(y_pru == 1) & (preds["modelo"] == 0),
        falso_positivo_regla=(y_pru == 0) & (preds["regla"] == 1),
        falso_positivo_modelo=(y_pru == 0) & (preds["modelo"] == 1),
        tramo_dias=pd.cut(pru["dias_para_vencer"], [-1, 0, 1, 3, 7, 30], labels=["0", "1", "2-3", "4-7", "8+"]),
    )
    por_categoria = errores.groupby("categoria")[
        ["vencido", "falso_negativo_regla", "falso_negativo_modelo", "falso_positivo_regla", "falso_positivo_modelo"]
    ].sum().astype(int)
    por_tramo = errores.groupby("tramo_dias", observed=True)[
        ["vencido", "falso_negativo_regla", "falso_negativo_modelo", "falso_positivo_regla", "falso_positivo_modelo"]
    ].sum().astype(int)
    por_categoria.to_csv(RESULTADOS / "errores_por_categoria.csv")
    por_tramo.to_csv(RESULTADOS / "errores_por_dias.csv")

    figuras_resultados(y_pru, probs, preds, lgbm, errores)

    tamanos = {
        nombre: {
            "filas": int(len(d)),
            "lotes": int(d["id_lote"].nunique()),
            "positivos": float(d["vencido"].mean()),
            "desde": PARTICIONES[nombre][0].isoformat(),
            "hasta": PARTICIONES[nombre][1].isoformat(),
        }
        for nombre, d in (("entrenamiento", ent), ("validacion", val), ("prueba", pru))
    }

    resumen_api = {
        "prueba": {
            "modelo": {k: resultados["modelo"][k] for k in ("recall", "precision", "accuracy", "f1", "prAuc", "avisoAnticipado2Dias")},
            "regla": {k: resultados["regla"][k] for k in ("recall", "precision", "accuracy", "f1", "avisoAnticipado2Dias")},
        },
        "particiones": tamanos,
    }
    exportar_modelo(lgbm, umbral_lgb, resumen_api)
    exportar_paridad(datos, lgbm)

    informe = {
        "particiones": tamanos,
        "prueba": resultados,
        "validacion": validacion,
        "comparacion": comparacion,
        "busquedaHiperparametros": historial,
        "parametrosElegidos": {k: v for k, v in lgbm.get_params().items() if k in ("num_leaves", "learning_rate", "min_child_samples", "subsample", "colsample_bytree", "reg_lambda")} | {"arboles": int(lgbm.best_iteration_)},
        "erroresPorCategoria": por_categoria.reset_index().to_dict("records"),
        "erroresPorDias": por_tramo.reset_index().astype({"tramo_dias": str}).to_dict("records"),
        "faltantes": {c: float(datos[c].isna().mean()) for c in ("consumo_7d", "consumo_28d")},
    }
    (RESULTADOS / "metricas.json").write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({"particiones": tamanos, "prueba": resultados, "comparacion": comparacion}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    principal()
