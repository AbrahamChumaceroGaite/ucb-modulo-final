# Kaffehaus · Riesgo de vencimiento de lotes

Proyecto final del módulo *Artificial Intelligence Capstone Project*
(Maestría, UCB Tarija). Abraham Chumacero Gaite.

Cada mañana el sistema revisa los lotes perecederos abiertos de la cafetería
(leche, tomate, croissants, galletas…) y estima la probabilidad de que cada
uno llegue a su fecha de vencimiento sin haberse terminado. Si la probabilidad
supera el umbral, el lote se marca «usar primero».

## Planteamiento

| Elemento | Decisión |
|---|---|
| Objetivo | Estimar, para cada lote de insumo perecedero, la probabilidad de que venza antes de terminar de usarse, para priorizar su uso y reducir el desperdicio |
| Práctica actual | El encargado revisa el stock a simple vista y usa primero lo que vence antes (FEFO). No avisa de nada |
| Unidad de observación | Un lote revisado una mañana: cantidad restante, días para vencer, lotes por delante y consumo reciente |
| Línea base | **Regla de cobertura**: avisar si, al ritmo de consumo de la última semana, el lote y los que van por delante no se terminan antes de vencer |
| Modelos | Regresión logística como base y **LightGBM** (clasificador) como modelo principal |
| Métrica principal | **Recall** de lotes vencidos: de los lotes que vencieron con saldo, cuántos se avisaron. Complementarias: accuracy, precisión, F1 y aviso con 2 días o más de margen |

**Ajuste del objetivo.** El planteamiento inicial decía «estimar cuántas
unidades de cada producto se venderán por día». Las demás columnas (la unidad
de observación, la línea base, el clasificador y el recall de lotes vencidos)
describen otra tarea: decidir qué lote corre riesgo. Se ajustó el objetivo a
esa tarea porque la acción que reduce la merma es por lote («este, úsalo
primero»). Las cantidades siguen presentes como entradas del modelo, en la
unidad de cada producto.

## Resultado en el conjunto de prueba

7.811 revisiones de 1.590 lotes que entraron entre el 29 de julio de 2025 y
el 30 de septiembre de 2026. Los cuatro métodos se evalúan sobre las mismas
filas y una sola vez.

| Método | Recall | Accuracy | Precisión | F1 | Aviso con ≥ 2 días |
|---|---|---|---|---|---|
| Práctica actual (FEFO a ojo) | 0,000 | 0,895 | — | 0,000 | 0 % |
| Regla de cobertura (línea base) | 0,661 | **0,904** | **0,534** | 0,591 | 77 % |
| Regresión logística | 0,866 | 0,766 | 0,293 | 0,438 | **97 %** |
| **LightGBM** | **0,873** | 0,884 | 0,472 | **0,613** | 94 % |

- LightGBM avisa 21 puntos más de lotes vencidos que la regla (bootstrap por
  lote: IC 95 % de 17 a 25 puntos). De 821 revisiones de lotes vencidos, deja
  pasar 104; la regla deja pasar 278.
- El costo son las falsas alarmas: 53 de cada 100 avisos del modelo son lotes
  que no vencieron. Por eso la regla gana en accuracy (0,904 contra 0,884), y
  la prueba de McNemar indica que esa diferencia es real (p < 0,001).
- La práctica actual tiene accuracy 0,895 sin avisar nunca, porque el 89 % de
  las revisiones son de lotes que no vencen. Es la razón para no usar accuracy
  como métrica principal.

El análisis completo, con los errores por producto y por días para vencer,
está en [`api/training/README.md`](api/training/README.md).

## Cómo está armado

```
Navegador ──cookie httpOnly──▶ web (Next.js)  :3408
                                 │ Authorization: Bearer
                                 ▼
                               api (NestJS)  :8082 ──▶ PostgreSQL (Docker)  :5433
                                 ▲                      backup.sql restaurado
api/training (Python) ── entrena y exporta ──▶ api/model/
```

| Carpeta | Contenido |
|---|---|
| `api/training/` | Construcción del dataset desde la copia de la base, entrenamiento, evaluación, figuras y exportación del modelo |
| `api/` | API NestJS: inicio de sesión y riesgo de cada lote. Calcula las variables y ejecuta el modelo exportado; no entrena |
| `web/` | Pantalla de lotes por vencer: lista con filtros, formulario para evaluar un lote, comparación con la línea base y límites del modelo |
| `docs/` | Informe técnico, presentación y capturas |

Flujo de una consulta: la web pide `GET /lot-risk`; la API toma el último día
con movimientos en la base, arma la revisión de la mañana siguiente para cada
lote abierto (saldo, fila FEFO y consumo de 7 y 28 días), calcula las 18
variables, recorre los árboles de LightGBM y compara la probabilidad con el
umbral. La web muestra el resultado junto a lo que diría la regla de cobertura.

## Cómo levantarlo

Requisitos: Docker, Node 22 y la copia `backup.sql` de la base (no se sube al
repositorio porque contiene datos personales). Python 3.12 o superior solo
hace falta para reentrenar.

1. **Base de datos**, desde esta carpeta:

   ```powershell
   copy C:\ruta\a\backup.sql api\training\data\raw\backup.sql
   docker compose up -d
   docker compose ps
   ```

   Esperar a que el estado diga `healthy`. La primera restauración tarda unos
   tres minutos.

2. **API**:

   ```powershell
   cd api
   npm install
   copy .env.example .env
   npm run build
   npm start
   ```

   Queda en http://localhost:8082/api/v1/health.

3. **Web**, en otra terminal:

   ```powershell
   cd web
   npm install
   copy .env.example .env
   npm run build
   npm start
   ```

   Queda en http://localhost:3408.

4. Entrar con la cuenta de desarrollo que crea
   [`api/database/seed-admin.sql`](api/database/seed-admin.sql): el correo y la
   contraseña están en su segunda línea.

El modelo ya viene entrenado en `api/model/`. Para reentrenarlo, ver
[`api/training/README.md`](api/training/README.md).

## Pruebas

| Carpeta | Comando | Qué comprueba |
|---|---|---|
| `api/training` | `python -m pytest` | 27 pruebas: lectura del volcado, saldos por lote, consumo, calendario, variables y métricas |
| `api` | `npm run check` | Tipos, reglas de capas, 73 pruebas unitarias (entre ellas, que variables y probabilidades coinciden con Python en 440 filas) y 18 pruebas HTTP |
| `api` | `npm run test:db` | 6 pruebas contra la base restaurada: los 17 lotes abiertos y sus datos coinciden con los del entrenamiento, y el inicio de sesión funciona |
| `web` | `npm run check` | Tipos, reglas de capas y 51 pruebas de la pantalla y sus reglas |
| `web` | `npm run test:e2e` | 12 pruebas en el navegador con la API y la base reales |

Las pruebas pedidas por la rúbrica están en `web/e2e/expiry-risk.spec.ts` y en
`api/test/app.e2e-spec.ts`:

- **Caso válido**: un lote de la lista evaluado en el formulario da la misma
  probabilidad que la lista; leche que rota rápido no se marca.
- **Caso difícil**: un lote sin historial de 28 días, revisado el mismo día que
  vence.
- **Entrada inválida**: el formulario marca el campo y no llama al modelo; la
  API rechaza con 422 un lote al que le queda más de lo que tenía.
- **Flujo completo**: entrar con la cuenta real, ver los 17 lotes abiertos de
  la base ordenados por riesgo y filtrarlos. Otras pruebas del mismo archivo
  evalúan un lote y cierran la sesión.

## Límites

- El modelo conoce 12 productos perecederos y el calendario 2021–2030. Con
  otros productos o fechas, la API responde 422 en lugar de estimar.
- Usa cantidades absolutas en la unidad de cada producto. Con valores muy
  lejanos a los habituales la probabilidad deja de ser confiable.
- La mitad de los avisos son falsas alarmas: el umbral se eligió para no dejar
  pasar lotes que vencen.
- La proporción de lotes vencidos bajó de 19 % en entrenamiento a 11 % en
  prueba. El modelo se entrenó con una cafetería que desperdiciaba más.
- La etiqueta depende de que cada vencimiento se registre. Un lote tirado sin
  registrar cuenta como consumido.
- Con la copia de la base, la lista se calcula para la mañana del 4 de octubre
  de 2026 (el día siguiente al último movimiento), no para la fecha actual.
- El sobrante estimado que muestra la pantalla sale de la regla de cobertura,
  no del modelo.

## Entregables

| Qué | Dónde |
|---|---|
| Informe técnico | [`docs/Informe_Tecnico_Kaffehaus.pdf`](docs/Informe_Tecnico_Kaffehaus.pdf) (y `.docx`) |
| Presentación | [`docs/Presentacion_Kaffehaus.pptx`](docs/Presentacion_Kaffehaus.pptx) |
| Código de entrenamiento | `api/training/src/` |
| Modelo para inferencia | `api/model/risk_model.json` (árboles, umbral y métricas) y `api/training/artifacts/model_lightgbm.txt` (formato nativo de LightGBM) |
| Resultados | `api/training/results/` y las figuras de `api/training/figures/` |
| Dataset derivado | `api/training/data/` (sin datos de personas). Se regenera desde la copia con `build_dataset.py` |
