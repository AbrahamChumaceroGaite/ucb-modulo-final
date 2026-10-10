# ml: datos, entrenamiento y evaluación

Todo lo que produce el modelo de riesgo de vencimiento que sirve `ml-api`. Se
ejecuta con Python 3.12 o superior.

```bash
python -m venv .venv && source .venv/bin/activate   # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
python src/generar_datos.py      # datos/ (sintéticos, semilla fija)
python src/entrenar.py           # artefactos/, figuras/, resultados/
cd ../ml-api && npm run modelo:actualizar   # copia los artefactos al servicio
```

Las dos órdenes son deterministas: con la misma semilla y las mismas versiones
de `requirements.txt` producen los mismos datos, el mismo modelo y las mismas
métricas. La única diferencia entre dos ejecuciones es la hora en
`entrenadoEl`.

## Qué hay en cada archivo

| Archivo | Qué hace |
|---|---|
| `src/calendario.py` | Feriados de Bolivia y Tarija 2025–2027 y vacaciones universitarias. Es lo único que se conoce de antemano del calendario, y se exporta a `artefactos/calendario.json` para que la API use exactamente el mismo |
| `src/caracteristicas.py` | De los datos crudos de una revisión a las 18 variables del modelo, y la regla de cobertura (línea base). La API lo replica línea a línea en TypeScript |
| `src/generar_datos.py` | Simulación de 18 meses de una cafetería universitaria: demanda, compras del encargado, consumo FEFO y vencimientos |
| `src/entrenar.py` | Partición temporal, línea base, regresión logística y LightGBM, umbral, métricas, pruebas estadísticas, figuras y exportación |

## El conjunto de datos

**Es sintético**, y el motivo es concreto: la cafetería todavía no registra un
kardex por lote con fecha de vencimiento (el módulo de inventario que lo
guardaría es justo lo que se está construyendo), así que no hay historia real
de la que aprender. La simulación reproduce los mecanismos que producen merma:

- **Demanda**: 13 insumos perecederos con un consumo base; factor por día de
  la semana (sábado 0,6; domingo 0,35), vacaciones universitarias (0,55),
  feriados (0,3), eventos ocasionales (+30 a 80 % el 4 % de los días), ruido
  gamma con coeficiente de variación 0,25 y una deriva lenta por insumo.
- **Compras**: el encargado pide con el promedio de la semana pasada y **no
  mira el calendario**, así que compra de más antes de fines de semana,
  feriados y vacaciones. El 12 % de las veces acepta una oferta y pide el
  doble; el 5 % se olvida de pedir.
- **Consumo FEFO** y vencimiento al final del día de vencimiento. Un lote es
  «vencido» si al vencer le queda más del 2 % de lo comprado.
- **Huecos del kardex**: el 3 % de los días no se registra el consumo de un
  insumo. El promedio se calcula sobre los días registrados.

| | |
|---|---|
| Periodo | 1 abr 2025 – 2 oct 2026 (18 meses) |
| Lotes | 2.082, de los cuales vence el 13 % |
| Revisiones (unidad de observación: un lote en un día) | 9.524, el 15 % de lotes que acabaron vencidos |
| Variables | 18: días para vencer, edad, vida útil, fracción que queda, consumo de 7 y 28 días, tendencia, días de cobertura, holgura, fracción por delante en FEFO, proporción de días de clases hasta vencer y en la última semana, día de la semana y 5 categorías |
| Faltantes | Consumo de 7 días: 1,1 %; de 28 días: 4,8 %. Solo al arrancar la historia |

**Limitación principal:** los resultados miden cuánto recupera el pipeline de
los mecanismos que se pusieron en la simulación, no cómo se comporta una
cafetería real. Antes de usarlo en serio hay que reentrenar con el kardex real
y volver a comparar con la línea base.

## Validación

- **Partición por la fecha de ingreso del lote**, con 22 días de embargo entre
  particiones (la vida útil más larga más uno): ningún lote ni su resultado
  cruzan de una partición a otra. No se usa k-fold aleatorio, porque
  predeciría el pasado con datos del futuro.
- Entrenamiento: abr 2025 – ene 2026 (5.286 filas, 1.070 lotes). Validación:
  22 feb – may 2026 (1.737 / 362). Prueba: 22 jun – 10 sep 2026 (1.411 / 296),
  solo con lotes cuyo resultado ya se conocía al corte.
- La validación se usa para la búsqueda de hiperparámetros (12 combinaciones,
  con parada temprana) y para elegir el umbral: la mayor precisión con recall
  de al menos 0,85. **La prueba se evalúa una vez, al final.**

## Resultados en prueba

| Método | Recall | Precisión | Accuracy | F1 | PR-AUC | Aviso con ≥ 2 días |
|---|---|---|---|---|---|---|
| Práctica actual (FEFO a ojo, no avisa) | 0,000 | — | 0,863 | 0,000 | — | 0 % |
| Regla de cobertura (línea base) | 0,819 | 0,782 | 0,944 | 0,800 | — | 77 % |
| Regresión logística | 0,907 | 0,785 | 0,953 | 0,841 | 0,913 | 89 % |
| **LightGBM** | **0,922** | 0,771 | 0,952 | 0,840 | **0,933** | **91 %** |

- **Bootstrap por lote** (2.000 réplicas): LightGBM detecta 10,4 puntos más de
  lotes vencidos que la regla, IC 95 % [3,3; 18,0]. La diferencia en recall
  es real.
- **McNemar** sobre todas las filas: p = 0,21. En aciertos totales no se puede
  afirmar que el modelo sea mejor que la regla; lo que gana es en los lotes
  que vencen, que es la métrica que importa.
- La **regresión logística queda cerca** del LightGBM. El salto grande está
  entre la regla y cualquier modelo que mire el calendario, no entre los dos
  modelos.

El detalle está en `resultados/metricas.json`; los errores por categoría y por
días para vencer, en `resultados/errores_por_*.csv`.

## Figuras

`figuras/fig1` a `fig4` son el diagnóstico de los datos (distribución del
objetivo, serie con estacionalidad, tasa de vencimiento del proceso actual y
faltantes de consumo por semana). `fig5` a `fig8` son los resultados (curva
precisión-recall, matrices de confusión, importancia de variables y falsos
negativos por días para vencer).
