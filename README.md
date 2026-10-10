# Kaffehaus · Riesgo de vencimiento de lotes

Proyecto final del módulo *Artificial Intelligence Capstone Project*
(Maestría, UCB Tarija). Abraham Chumacero Gaite.

El sistema avisa qué lotes de insumos perecederos de la cafetería conviene
usar primero porque, al ritmo de consumo actual y con el calendario que viene
por delante, es probable que venzan con saldo.

| Elemento | Decisión |
|---|---|
| Problema | Merma por vencimiento: hoy el 13 % de los lotes vence con saldo |
| Unidad de observación | Un lote de insumo revisado en una fecha |
| Línea base | La práctica actual (FEFO a ojo, no avisa) y la **regla de cobertura**: avisar si, al ritmo de la última semana, el lote y los que van por delante no se terminan antes de vencer |
| Modelo | LightGBM (clasificador binario), comparado también con regresión logística |
| Métrica principal | **Recall** de la clase «vence con saldo». Complementarias: accuracy, precisión, F1, PR-AUC y aviso con 2 días o más |
| Datos | Sintéticos y coherentes (18 meses, 13 insumos, calendario boliviano), con generador y semilla |

## Resultado en el conjunto de prueba

| Método | Recall | Precisión | Accuracy | Aviso con ≥ 2 días |
|---|---|---|---|---|
| Práctica actual | 0,000 | — | 0,863 | 0 % |
| Regla de cobertura | 0,819 | 0,782 | 0,944 | 77 % |
| Regresión logística | 0,907 | 0,785 | 0,953 | 89 % |
| **LightGBM** | **0,922** | 0,771 | 0,952 | **91 %** |

El modelo detecta 10,4 puntos más de lotes vencidos que la regla (bootstrap
por lote, IC 95 % [3,3; 18,0]). En aciertos totales la diferencia no es
significativa (McNemar p = 0,21). Detalle en `ml/README.md`.

## Piezas

```
Navegador ──cookie httpOnly──▶ web (Next, BFF) ──Bearer──▶ Spring  :8081   productos, recetas, ventas…
                                   │
                                   └──────────Bearer──▶ ml-api  :8082   evaluacion-lote, modelo-riesgo
                                                          (NestJS + modelo LightGBM en JSON)
ml/ (Python) ──entrena y exporta──▶ ml-api/modelo/
```

| Carpeta | Qué es |
|---|---|
| `ml/` | Generador de datos, entrenamiento, evaluación, figuras y exportación del modelo |
| `ml-api/` | Servicio NestJS con la arquitectura de `ucb-smc-api-v2` (contextos, CQRS, puertos) que ejecuta el modelo |
| `web/` | La web de Kaffehaus. Se añadió la feature `vencimientos` en `/inventario`, con las reglas de su `RULES.md` |
| `docs/` | Informe y capturas |

## Cómo levantarlo

Requisitos: Node 20+, Python 3.12+ (solo para reentrenar) y el backend Spring
de Kaffehaus para iniciar sesión.

1. **Spring** (`api/kaffehausv4`), en el puerto 8081, como siempre.
2. **Servicio de predicción:**

   ```bash
   cd ml-api
   npm install
   cp .env.example .env      # mismos JWT_SECRET y JWT_ISSUER que Spring
   npm run build && npm start
   ```

3. **Web:**

   ```bash
   cd web
   npm install
   # en .env.local: API_URL=http://localhost:8081 y ML_API_URL=http://localhost:8082
   npm run dev -- -p 3408
   ```

4. Entrar con un usuario de Spring e ir a **Inventario**.

El modelo ya viene entrenado en `ml-api/modelo/`. Para reentrenarlo:
`cd ml && pip install -r requirements.txt && python src/generar_datos.py && python src/entrenar.py`,
y luego `cd ../ml-api && npm run modelo:actualizar`.

## Pruebas

| Dónde | Orden | Qué cubre |
|---|---|---|
| `ml-api` | `npm run check` | 32 unitarias (paridad con Python en 440 filas, árboles, reglas, handler, repositorio) y 10 de extremo a extremo por HTTP: caso válido, caso difícil, entrada inválida, reglas de negocio, autenticación |
| `web` | `npm run check` | Tipos, lint, tokens, código muerto, auditoría de pantallas y 275 pruebas (25 de la feature nueva, incluido el flujo completo de la vista con `fetch` como único doble) |
| Navegador | — | Recorrido en el build de producción con el servicio levantado: lista a 1280, 768 y 375 px, tema oscuro, tabla, ficha, formulario, filtros en móvil y evaluación completa. Capturas en `docs/capturas/` |

## Límites

- **Los datos son sintéticos.** Las métricas dicen cuánto recupera el pipeline
  de los mecanismos simulados, no cómo rinde en una cafetería real. Hay que
  reentrenar con el kardex real antes de fiarse de un número.
- El modelo solo conoce los 13 insumos y el calendario 2025–2027 con los que
  se entrenó; fuera de eso responde 422 en vez de adivinar.
- Las evaluaciones viven en memoria: al reiniciar `ml-api` se pierden las
  manuales y se vuelve a sembrar el inventario.
- De cada 100 avisos, 23 son falsas alarmas: el umbral se eligió para no dejar
  pasar lotes que vencen, no para avisar poco.
