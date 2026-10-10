# Kaffehaus · Riesgo de vencimiento de lotes

Proyecto final del módulo *Artificial Intelligence Capstone Project*
(Maestría, UCB Tarija). Abraham Chumacero Gaite.

Cada mañana, el sistema revisa los lotes perecederos abiertos de la cafetería
(leche, tomate, croissants…) y estima la probabilidad de que cada uno llegue a
su fecha de vencimiento sin haberse usado entero. Por encima del umbral, el
lote se marca «usar primero».

| Elemento | Decisión |
|---|---|
| Objetivo | Estimar, para cada lote de insumo perecedero, la probabilidad de que venza antes de terminar de usarse, para priorizar su uso y disminuir el desperdicio |
| Unidad de observación | Un lote con su cantidad restante, días para vencer y consumo reciente, revisado una mañana |
| Línea base | La práctica actual (FEFO a ojo, que no avisa) y la **regla de cobertura**: avisar si, al ritmo de la última semana, el lote y los que van por delante no se terminan antes de vencer |
| Modelos | Regresión logística como base y **LightGBM** como modelo principal |
| Métrica principal | **Average Precision** del vencimiento. Para decidir: recall en el umbral, recall con 3 avisos por mañana, merma en bolivianos avisada a tiempo y precisión |
| Datos | Copia de la base de datos de Kaffehaus: 6.396 lotes de 12 perecederos (oct 2021 – oct 2026), 32.406 revisiones |

**Sobre el objetivo.** El Excel decía «estimar cuántas unidades de cada
producto se venderán por día». Las otras columnas (la unidad de observación,
la línea base, el clasificador y el recall de lotes vencidos) hablan de lotes,
y la acción que reduce la merma también: «este lote, úsalo primero». Se
reformuló el objetivo para que las cinco columnas sean coherentes. Las
cantidades siguen ahí como entradas del modelo, en la unidad de cada producto
(ml, g o unidades), y la pantalla muestra el sobrante estimado en esa unidad.

## Resultado en el conjunto de prueba

7.811 revisiones de 1.590 lotes que ingresaron entre jul 2025 y sep 2026,
evaluadas una sola vez:

| Método | AP | Recall | Precisión | Accuracy | Recall con 3 avisos | Merma avisada a tiempo |
|---|---|---|---|---|---|---|
| Práctica actual | — | 0,000 | — | 0,895 | — | 0 % |
| Regla de cobertura | 0,472 | 0,661 | **0,534** | **0,904** | 0,925 | 79 % |
| Regresión logística | 0,464 | 0,866 | 0,293 | 0,766 | 0,874 | **97 %** |
| **LightGBM** | **0,695** | **0,873** | 0,472 | 0,884 | **0,975** | 96 % |

LightGBM ordena mejor los lotes (AP) y avisa de 21 puntos más de lotes
vencidos que la regla (bootstrap por lote, IC 95 % [17; 25]). De los Bs 2.659
que vencieron en prueba, sus avisos a tiempo cubren Bs 2.554; los de la
regla, Bs 2.111. A cambio, acierta menos filas en total: la regla gana en
accuracy y McNemar confirma que esa diferencia es real. Detalle y análisis de errores en [`api/training/README.md`](api/training/README.md).

## Piezas

```
Navegador ──cookie httpOnly──▶ web  (Next.js, BFF)  :3408
                                 │ Bearer
                                 ▼
                               api  (NestJS)  :8082 ──▶ Postgres (Docker)  :5433
                                 ▲                       backup.sql restaurado
api/training (Python) ──entrena y exporta──▶ api/model/
```

| Carpeta | Qué es |
|---|---|
| `api/training/` | Dataset desde la copia de la base, entrenamiento, evaluación, figuras y exportación del modelo |
| `api/` | API NestJS: inicio de sesión y riesgo de cada lote. Ejecuta el modelo LightGBM exportado, sin reentrenar |
| `web/` | Pantalla de lotes por vencer: lista con filtros, formulario para evaluar un lote, la comparación con la línea base y un recorrido guiado («Cómo funciona», con Driver.js) |
| `docs/` | Informe técnico (PDF y Word), presentación y capturas |

## Cómo levantarlo

Requisitos: Docker, Node 22 y la copia `backup.sql` (no se versiona: tiene
datos personales). Python 3.12 solo para reentrenar.

1. **Base de datos**, desde esta carpeta:

   ```powershell
   copy C:\ruta\a\backup.sql api\training\data\raw\backup.sql
   docker compose up -d
   docker compose ps          # esperar a «healthy»: la primera restauración tarda
   ```

2. **API**:

   ```powershell
   cd api
   npm install
   copy .env.example .env
   npm run build
   npm start                  # http://localhost:8082/api/v1/health
   ```

3. **Web**, en otra terminal:

   ```powershell
   cd web
   npm install
   npm run build
   npm start                  # http://localhost:3408
   ```

4. Entrar con la cuenta de desarrollo que crea
   [`api/database/seed-admin.sql`](api/database/seed-admin.sql) (el correo y la
   contraseña están en su segunda línea).

El modelo ya viene entrenado en `api/model/`. Para reentrenarlo, ver
[`api/training/README.md`](api/training/README.md).

## Pruebas

| Dónde | Orden | Qué cubre |
|---|---|---|
| `api/training` | `pytest` | 31 pruebas: lectura del volcado, saldos por lote, calendario, variables y métricas (incluidas capacidad fija y merma en Bs) |
| `api` | `npm run check` | Tipos, lint de capas, 70 unitarias (paridad con Python en 440 filas, reglas, handlers) y 18 HTTP (caso válido, caso difícil, 7 entradas inválidas, autenticación) |
| `api` | `npm run test:db` | 6 pruebas contra la base restaurada: los 17 lotes abiertos coinciden con los del entrenamiento |
| `web` | `npm run check` | Tipos, lint de capas y 51 pruebas, incluido el flujo completo de la pantalla con `fetch` como único doble y que cada paso del recorrido guiado tenga su elemento |
| `web` | `npm run test:e2e` | 12 pruebas en Chromium sobre el build de producción, la API y la base reales: flujo completo, caso válido, caso difícil, entradas inválidas, recorrido guiado, sesión, consola limpia y sin scroll horizontal a 375, 768 y 1280 px |

`test:e2e` levanta la API y la web si no están corriendo; la base tiene que
estar arriba.

## Límites

- El modelo solo conoce los 12 perecederos y el calendario 2021–2030 con los
  que se entrenó. Fuera de eso la API responde 422 en vez de adivinar.
- De cada 100 avisos, 53 son falsas alarmas: el umbral prioriza no dejar
  pasar lotes que vencen.
- Usa cantidades absolutas en la unidad del producto. Con valores muy lejos de
  los habituales la probabilidad no tiene sentido, aunque la regla sí lo tenga.
- El sobrante estimado que muestra la pantalla sale de la regla de cobertura,
  no del modelo.
- Con la copia de la base, la lista se calcula para la mañana siguiente al
  último movimiento (4 oct 2026), no para hoy: contar los días desde la copia
  como consumo cero marcaría todo en riesgo.
- La etiqueta depende de que cada vencimiento se registre en el kardex. Un
  lote tirado sin registrar cuenta como consumido.

## Entregables

| Qué | Dónde |
|---|---|
| Informe técnico | [`docs/Informe_Tecnico_Kaffehaus.pdf`](docs/Informe_Tecnico_Kaffehaus.pdf) (y `.docx`) |
| Presentación | [`docs/Presentacion_Kaffehaus.pptx`](docs/Presentacion_Kaffehaus.pptx) |
| Resultados de evaluación | [`api/training/results/metrics.json`](api/training/results/metrics.json), `errors_by_product.csv`, `errors_by_days.csv` y las figuras de `api/training/figures/` |
| Dataset | Los CSV derivados en `api/training/data/` (sin datos de personas). La copia de la base no se versiona; con ella, `python src/build_dataset.py` los regenera |
| Modelo final | `api/model/risk_model.json` (volcado de los árboles, umbral y métricas) y `api/training/artifacts/model_lightgbm.txt` |
| Versión final | Etiqueta `v1.0` |
