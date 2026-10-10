# API

Servicio NestJS con dos funciones: iniciar sesión con las cuentas de la
cafetería y calcular el riesgo de vencimiento de los lotes perecederos. Lee la
base de datos de Kaffehaus (restaurada desde la copia) y ejecuta el modelo
LightGBM entrenado en `training/`.

## Arrancar

Requisitos: Node 22 y la base levantada con `docker compose up -d` desde la
carpeta raíz (ver el README principal).

```powershell
npm install
copy .env.example .env
npm run build
npm start
```

Queda en http://localhost:8082/api/v1/health. Si falta el modelo, el secreto
JWT o la URL de la base, la API no arranca y dice qué variable falta.

Variables de `.env` (los valores de `.env.example` sirven para desarrollo):

| Variable | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL restaurado, por defecto en el puerto 5433 |
| `JWT_SECRET` | Firma de los tokens, 32 caracteres o más |
| `ACCESS_TOKEN_MINUTES`, `REFRESH_TOKEN_DAYS` | Duración de los tokens (15 minutos y 7 días) |
| `MODEL_DIR` | Carpeta con `risk_model.json` y `calendar.json` |
| `CORS_ORIGIN` | Origen de la web |

## Endpoints

Prefijo `/api/v1`. Todas las rutas piden `Authorization: Bearer <access token>`
salvo `health`, `auth/login` y `auth/refresh`.

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | Responde `{ "status": "ok" }` |
| `POST /auth/login` | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| `POST /auth/refresh` | `{ refreshToken }` → `{ accessToken }` |
| `GET /lot-risk` | Lotes perecederos abiertos con su riesgo, del más probable al menos. Filtros: `level` (`high,watch,low`), `family`, `search`, `skip`, `limit` |
| `POST /lot-risk/evaluate` | Evalúa un lote escrito en el formulario. No guarda nada |
| `GET /risk-model` | Ficha del modelo: versión, umbral, productos, particiones y métricas de prueba frente a la regla de cobertura |

Cuerpo de `POST /lot-risk/evaluate`, con cantidades en la unidad del producto
(ml, g o unidades):

```json
{
  "productId": "<id tomado de GET /risk-model>",
  "receivedOn": "2026-03-02",
  "expiresOn": "2026-03-09",
  "reviewedOn": "2026-03-04",
  "initialQuantity": 1000,
  "remainingQuantity": 900,
  "stockAhead": 1000,
  "usage7d": 100,
  "usage28d": 150
}
```

Los errores tienen siempre la misma forma y el mensaje en español:

```json
{ "status": 422, "error": "BusinessRule", "message": "No puede quedar más de lo que tenía el lote.", "timestamp": "…" }
```

| Código | Cuándo |
|---|---|
| 400 `Validation` | Campo desconocido, texto en lugar de número, fecha que no es `AAAA-MM-DD`, filtro con un valor inexistente |
| 401 `Unauthorized` | Credenciales incorrectas, token ausente o vencido, refresh token usado como access token |
| 404 `NotFound` | Ruta inexistente |
| 422 `BusinessRule` | Producto que el modelo no conoce, queda más de lo que entró, el lote ya venció, fechas fuera del calendario 2021–2030 |
| 503 `Unavailable` | La base de datos no responde |

## Cómo calcula el riesgo

`GET /lot-risk` sigue estos pasos:

1. Busca el último día con movimientos en la base. La revisión es la mañana
   siguiente: con una base en uso es hoy; con la copia, el 4 de octubre de 2026.
2. Lee en PostgreSQL los lotes perecederos abiertos esa mañana: contenido,
   saldo, lotes del mismo producto que vencen antes (fila FEFO) y consumo
   promedio de los últimos 7 y 28 días
   (`infrastructure/persistence/open-lot.postgres.repository.ts`).
3. Valida cada lote con los objetos de valor del dominio (`LotReview`).
4. Calcula las 18 variables (`domain/services/features.ts`), las mismas y en el
   mismo orden que `training/src/features.py`.
5. Recorre los 139 árboles de LightGBM exportados en JSON
   (`domain/services/lightgbm-forest.ts`): la probabilidad es la sigmoide de la
   suma de las hojas alcanzadas.
6. Compara la probabilidad con el umbral (0,14, elegido en validación) y
   agrega lo que diría la regla de cobertura.
7. Filtra, ordena por probabilidad y pagina.

`POST /lot-risk/evaluate` hace los pasos 3 a 6 con el lote del formulario.
Nada se guarda: el riesgo se calcula en cada petición a partir de los
movimientos.

## Arquitectura

```
src/
├─ main.ts, app.module.ts, configure-app.ts
├─ libs/                  excepción de dominio, paginación, configuración, pool de
│                         PostgreSQL, guard JWT, filtro de errores, logger
└─ contexts/
   ├─ auth/               inicio de sesión
   └─ expiry_risk/        riesgo de vencimiento
      ├─ domain/          objetos de valor, entidad RiskModel, variables, árboles, puertos
      ├─ application/     consultas CQRS y sus handlers, DTO, mapeo a respuesta
      ├─ infrastructure/  carga del modelo desde archivo, lectura de lotes en PostgreSQL
      └─ presentation/    controladores
```

- Las dependencias van hacia el dominio y las comprueba `npm run lint`: el
  dominio no importa Nest, `pg` ni `jsonwebtoken`; la aplicación solo habla con
  puertos; un contexto no importa al otro.
- Los handlers devuelven `T | DomainException`. El controlador lanza el error
  con `unwrap` y el filtro global arma la respuesta.
- Las contraseñas son los hashes que ya existen en `usuario` (PBKDF2-SHA256),
  comparados en tiempo constante.
- Los tokens no tienen estado: cerrar sesión borra las cookies de la web, pero
  un refresh token sigue siendo válido hasta que vence (7 días).

## Actualizar el modelo

```powershell
cd training
.venv\Scripts\python src\train.py
cd ..
npm run model:update
npm run check
```

`model:update` copia los artefactos a `model/`. Si el entrenamiento cambió las
variables o su orden, la API no arranca y lo indica.

## Pruebas

```powershell
npm run check       # tipos, lint, 73 pruebas unitarias y 18 pruebas HTTP
npm run test:db     # 6 pruebas contra la base restaurada (Docker levantado)
```

- **Paridad con Python**: las 18 variables de 440 revisiones exportadas por el
  entrenamiento coinciden exactamente, y la probabilidad difiere en menos de
  1e-12.
- **Caso válido**: tomates que no se alcanzan a usar quedan en `high`; leche que
  rota rápido, en `low`.
- **Caso difícil**: lote sin historial de 28 días, revisado el día que vence.
- **Entradas inválidas**: 7 casos de 400 y 422 por HTTP y 11 reglas de los
  objetos de valor.
- **Flujo completo**: login, lista, renovación del token y lista otra vez.
- **Base real** (`test:db`): los 17 lotes abiertos del 4 de octubre de 2026 y
  sus datos coinciden con `training/data/open_lots.json`, y el login funciona
  con la cuenta de desarrollo.

Las pruebas HTTP de `check` usan repositorios en memoria en lugar de
PostgreSQL; `test:db` cubre el SQL.
