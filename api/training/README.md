# Entrenamiento: datos, modelo y evaluación

Todo lo que produce el modelo de riesgo de vencimiento que usa la API. Python
3.12 o superior (los artefactos se generaron con 3.13).

## Reproducir

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt

copy C:\ruta\a\backup.sql data\raw\backup.sql
python src\build_dataset.py      # data\: dataset derivado de la copia
python src\train.py              # artifacts\, figures\, results\
python -m pytest                 # 27 pruebas

cd ..
npm run model:update             # copia los artefactos a api\model\
```

Los dos scripts son deterministas: semillas fijas y LightGBM en un solo hilo.
Dos ejecuciones dan los mismos datos, el mismo modelo y las mismas métricas;
solo cambia la fecha `trainedAt`.

| Archivo | Qué hace |
|---|---|
| `src/dump_reader.py` | Lee las tablas directamente del volcado `pg_dump`, sin restaurarlo |
| `src/build_dataset.py` | Reconstruye lotes, saldos diarios y consumo, y arma las revisiones con su etiqueta |
| `src/calendar_bo.py` | Feriados de Bolivia y Tarija y vacaciones universitarias, 2021–2030. Se exporta a `calendar.json` para que la API use el mismo |
| `src/features.py` | De una revisión a las 18 variables del modelo, y la regla de cobertura. La API lo replica en TypeScript |
| `src/models.py` | Regresión logística y LightGBM con su búsqueda de hiperparámetros |
| `src/evaluation.py` | Métricas, elección del umbral, bootstrap por lote y McNemar |
| `src/train.py` | Partición temporal, entrenamiento, evaluación, figuras y exportación |
| `src/export.py` | El modelo en JSON para la API y 440 filas de paridad para sus pruebas |

## Datos

**Origen.** Copia real (`pg_dump`, PostgreSQL 16) de la base de datos de la
cafetería Kaffehaus, con movimientos de inventario desde octubre de 2021 hasta
el 3 de octubre de 2026. La copia no se sube al repositorio porque contiene
datos personales de las cuentas; sí se suben los archivos derivados de
`data/`, que no tienen información de personas.

Tablas usadas: `lote` (5.862 compras), `detalle_lote` (8.096 líneas con
producto y fecha de vencimiento), `existencias` (19.543 envases abiertos),
`movimientos` (374.404) y `tipo_movimiento`.

**Preparación** (`build_dataset.py`):

1. **Productos perecederos**: los 12 con vida útil mediana de 28 días o menos.
   El siguiente producto, mantequilla, dura 46 días, así que el corte es
   limpio. Se agrupan en cinco familias: lácteos, fiambres, panadería, frutas y
   verduras, y huevos.
2. **Contenido y saldo de cada lote**: cada unidad abierta es un envase con
   movimientos de apertura, consumo, merma, vencimiento, ajustes y
   devoluciones. Entradas menos salidas da exactamente el contenido guardado
   en los 19.543 envases, lo que confirma la reconstrucción.
3. **Limpieza**: 126 movimientos «Vencimiento» eran ventas anuladas que se
   tiraron (van en pareja con una «Devolucion venta» del mismo envase, monto e
   instante). No son vencimientos y se descartan.
4. **Consumo diario** por producto, con cero los días sin uso, y sus promedios
   de 7 y 28 días hasta el día anterior.
5. **Revisiones**: una fila por lote abierto y por cada mañana de su vida, con
   lo que se sabía esa mañana: saldo, lotes por delante en la fila FEFO y
   consumo hasta ayer.
6. **Etiqueta**: el lote venció con más del 2 % de su contenido.

| | |
|---|---|
| Lotes | 6.396; 6.358 con resultado conocido; 13,2 % vencieron con saldo |
| Revisiones (unidad de observación) | 32.406; el 15,6 % son de lotes que vencieron |
| Productos | Brownie, crema de leche, croissant, galletas, huevo, jamón, dos leches, naranja, pan de molde, queso y tomate |
| Faltantes | Consumo de 7 días 0,3 % y de 28 días 1,4 %, solo al inicio de la historia de cada producto |

**Variables** (18): días para vencer, edad del lote, vida útil, fracción que
queda, consumo de 7 y 28 días, tendencia del consumo, días de cobertura,
holgura (días para vencer menos cobertura), fracción por delante en la fila
FEFO, proporción de días de clases hasta el vencimiento y en la última semana,
día de la semana y familia del producto.

## Validación

- **Partición temporal por la fecha de entrada del lote**, con 29 días de
  separación entre bloques (la vida útil más larga más uno). Así ningún lote ni
  su resultado aparecen en dos particiones, y el modelo nunca aprende del
  futuro. No se usa validación cruzada aleatoria por la misma razón.

  | Partición | Lotes que entraron | Revisiones | Lotes | Vencidos |
  |---|---|---|---|---|
  | Entrenamiento | oct 2021 – jun 2024 | 17.285 | 3.308 | 19,4 % |
  | Validación | 29 jul 2024 – jun 2025 | 6.335 | 1.272 | 11,4 % |
  | Prueba | 29 jul 2025 – sep 2026 | 7.811 | 1.590 | 10,5 % |

- La **validación** elige los hiperparámetros y el umbral. La **prueba** se
  evalúa una sola vez, al final.

## Modelos

- **Línea base, regla de cobertura**: avisa si, al consumo de la última
  semana, el lote y los que van por delante no se terminan antes de vencer.
  Sin consumo registrado no avisa.
- **Regresión logística**: imputación por mediana, estandarización y pesos
  balanceados por clase.
- **LightGBM** (clasificador binario): búsqueda en 12 combinaciones
  (`num_leaves` 7, 15 o 31; `learning_rate` 0,03 u 0,08; `min_child_samples`
  20 o 60) con parada temprana en validación. Ganó `num_leaves` 15,
  `learning_rate` 0,08 y `min_child_samples` 20, con 139 árboles,
  `subsample` y `colsample_bytree` 0,8 y `reg_lambda` 1. Maneja los faltantes
  de forma nativa.
- **Umbral**: el de mayor precisión que mantiene un recall de al menos 0,85 en
  validación. Queda en 0,140 (recall de validación 0,852).

**Por qué recall es la métrica principal.** Un lote que vence sin aviso es
merma segura; una falsa alarma solo adelanta el uso de un lote que se habría
usado igual. Accuracy no sirve como principal: la práctica actual, que nunca
avisa, ya tiene 0,895 porque la mayoría de las revisiones son de lotes que no
vencen. Se reportan además precisión, F1 y la proporción de lotes vencidos
avisados con 2 días o más de margen, que es el tiempo útil para reaccionar.

## Resultados en prueba

| Método | Recall | Accuracy | Precisión | F1 | Aviso con ≥ 2 días |
|---|---|---|---|---|---|
| Práctica actual (FEFO a ojo) | 0,000 | 0,895 | — | 0,000 | 0 % |
| Regla de cobertura | 0,661 | **0,904** | **0,534** | 0,591 | 77 % |
| Regresión logística | 0,866 | 0,766 | 0,293 | 0,438 | **97 %** |
| **LightGBM** | **0,873** | 0,884 | 0,472 | **0,613** | 94 % |

Matrices de confusión sobre 7.811 revisiones (821 de lotes vencidos):

| | Avisos correctos | Falsas alarmas | Vencidos sin aviso |
|---|---|---|---|
| Regla de cobertura | 543 | 474 | 278 |
| LightGBM | 717 | 801 | 104 |

- **Bootstrap por lote** (2.000 réplicas): el recall de LightGBM supera al de
  la regla en 0,212, IC 95 % [0,171; 0,252]. Se remuestrean lotes completos
  porque las revisiones de un mismo lote están correlacionadas.
- **McNemar** sobre todas las filas: la regla acierta en 450 filas donde el
  modelo falla, y el modelo en 297 donde la regla falla (p < 0,001). En
  aciertos totales la regla es mejor; el modelo gana en lo que importa, los
  lotes que vencen.
- **Regresión logística**: alcanza un recall parecido, pero con 1.718 falsas
  alarmas. Con las variables de cobertura, el salto grande lo da LightGBM.
- **Importancia de variables** (ganancia): holgura 67 %, consumo de 28 días
  12 %, consumo de 7 días 4 %, tendencia 4 %. El modelo aprende sobre todo una
  versión más fina de la regla de cobertura.

## Análisis de errores

En `results/errors_by_product.csv` y `results/errors_by_days.csv`:

- **Por producto**: donde la regla falla más, el modelo recupera más. En
  tomate, la regla deja pasar 73 revisiones de lotes vencidos y el modelo 16;
  en croissant, 58 contra 14. El modelo falla más en crema de leche (26 de 88)
  y pan de molde (10 de 16), con pocos vencimientos para aprender.
- **Por días para vencer**: casi no falla cerca del vencimiento (7 de 159 el
  mismo día) y falla más lejos de él: 23 de 45 revisiones con más de 7 días.
  Ahí el consumo futuro es más incierto.
- **Falsas alarmas**: se concentran en panadería y tomate, los productos con
  más vencimientos. Leche, jamón y queso casi no generan avisos.

## Limitaciones

- **Deriva**: la proporción de lotes vencidos baja de 19 % en entrenamiento a
  11 % en prueba. La cafetería desperdicia menos que antes y el modelo puede
  sobreestimar el riesgo.
- **Etiqueta**: depende de que el vencimiento se registre. Un lote tirado sin
  registrar cuenta como consumido.
- **Alcance**: solo los 12 productos y el calendario 2021–2030. Las cantidades
  van en la unidad de cada producto; valores muy distintos de los históricos
  no dan probabilidades confiables.
- **Falsas alarmas**: 53 de cada 100 avisos, a cambio del recall.

## Figuras

| Figura | Muestra |
|---|---|
| `fig1_target_distribution` | Proporción de revisiones de lotes vencidos |
| `fig2_usage_seasonality` | Consumo diario de leche: ciclo semanal y vacaciones |
| `fig3_waste_rate` | Tasa mensual de lotes vencidos con la práctica actual |
| `fig4_missing_usage` | Dónde faltan los promedios de consumo |
| `fig5_pr_curve` | Curvas precisión-recall en prueba |
| `fig6_confusion_matrices` | Matrices de confusión de la regla y del modelo |
| `fig7_feature_importance` | Importancia de variables de LightGBM |
| `fig8_errors_by_days` | Vencidos sin aviso según días para vencer |

## Artefactos

| Archivo | Uso |
|---|---|
| `artifacts/risk_model.json` | Árboles en JSON, umbral, variables, catálogo y métricas. Lo carga la API |
| `artifacts/calendar.json` | Calendario de feriados y vacaciones |
| `artifacts/parity.json` | 440 revisiones con sus variables y probabilidad esperadas, para las pruebas de la API |
| `artifacts/model_lightgbm.txt` | El mismo modelo en formato nativo de LightGBM |
| `results/metrics.json` | Todas las métricas, la búsqueda de hiperparámetros y las pruebas estadísticas |
