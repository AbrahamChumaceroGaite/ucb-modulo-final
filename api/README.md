# API de Kaffehaus ML

Servicio NestJS con dos tareas: iniciar sesión contra las cuentas de la
cafetería y decir qué lotes perecederos abiertos tienen riesgo de vencer con
saldo. Lee la base de datos real de Kaffehaus (restaurada desde una copia) y
ejecuta el modelo LightGBM que entrena `training/`.

No usa el backend de Spring. La web habla solo con este servicio.

## Arrancar

Requisitos: Node 22, Docker (para la base) y la copia `backup.sql`.

```powershell
# 1. La copia de la base, que no se versiona porque tiene datos personales
copy C:\ruta\a\backup.sql training\data\raw\backup.sql

# 2. Postgres 16 en el puerto 5433, con la copia restaurada y un administrador de desarrollo
docker compose up -d          # desde la carpeta raíz del proyecto

# 3. La API
npm install
copy .env.example .env
npm run build
npm start                     # http://localhost:8082/api/v1/health
```

La primera vez, Postgres tarda en restaurar las 370 000 filas de
movimientos; `docker compose ps` muestra `healthy` cuando termina. El script
`database/seed-admin.sql` crea `admin@kaffehaus.bo` con la contraseña de
desarrollo que está en su primera línea. Cámbiela antes de usar datos reales.

Si falta el modelo, el secreto o la URL de la base, la API no arranca y dice
qué falta. No hay modo «a medias».

## Endpoints

Prefijo `/api/v1`. Todo pide `Authorization: Bearer <access token>` salvo
`health`, `auth/login` y `auth/refresh`.

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | `{ "status": "ok" }` |
| `POST /auth/login` | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| `POST /auth/refresh` | `{ refreshToken }` → `{ accessToken }` |
| `GET /lot-risk` | Lotes perecederos abiertos, con su riesgo, del más probable al menos. Filtros: `level` (`high,watch,low`), `family`, `search`, `skip`, `limit` |
| `POST /lot-risk/evaluate` | Evalúa un lote escrito a mano («¿y si…?»). No guarda nada |
| `GET /risk-model` | Ficha del modelo: versión, umbral, productos, particiones y métricas de prueba frente a la regla base |

`GET /lot-risk` revisa los lotes **la mañana siguiente al último movimiento
registrado**. Con una base viva es hoy; con la copia, es el 4 de octubre de
2026. Usar la fecha del reloj sobre una copia contaría cada día desde la copia
como consumo cero y marcaría todo en riesgo.

Cuerpo de `POST /lot-risk/evaluate` (cantidades en la unidad del producto:
ml, g o unidades):

```json
{
  "productId": "<id de GET /risk-model>",
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

Los errores tienen siempre la misma forma, con el mensaje en español:

```json
{ "status": 422, "error": "BusinessRule", "message": "No puede quedar más de lo que tenía el lote.", "timestamp": "…" }
```

| Código | Cuándo |
|---|---|
| 400 `Validation` | Forma incorrecta: campo desconocido, texto donde va un número, fecha que no es `AAAA-MM-DD`, filtro con un valor que no existe |
| 401 `Unauthorized` | Correo o contraseña incorrectos (un solo mensaje para los dos casos), sin token, token caducado o refresh token usado como access token |
| 404 `NotFound` | Ruta que no existe |
| 422 `BusinessRule` | Producto que el modelo no conoce, queda más de lo que entró, el lote ya venció, fechas fuera del calendario 2021–2030 |

## Arquitectura

La del curso (`ucb-smc-api-v2`): contextos con cuatro capas, CQRS con
`@nestjs/cqrs` y puertos inyectados por token.

```
src/
├─ main.ts, app.module.ts, configure-app.ts
├─ libs/                  lo compartido: excepción de dominio, paginación, configuración,
│                         pool de Postgres, guard JWT, filtro de errores, logger
└─ contexts/
   ├─ auth/               inicio de sesión
   └─ expiry_risk/        riesgo de vencimiento
      ├─ domain/          objetos de valor, entidad RiskModel, cálculo de variables, árboles, puertos
      ├─ application/     consultas y handlers, DTO, mapeo a respuesta
      ├─ infrastructure/  carga del modelo desde archivo, lectura de lotes en Postgres
      └─ presentation/    controladores
```

Las dependencias van hacia dentro y las comprueba `npm run lint`, no la buena
voluntad: el dominio no importa Nest, `pg` ni `jsonwebtoken`; la aplicación no
importa infraestructura (salvo el logger); un contexto no importa al otro. Se
probó plantando cada tipo de violación.

Decisiones que vale la pena explicar:

- **Sin tablas propias.** El riesgo se calcula en cada petición a partir de
  los movimientos. Guardarlo lo dejaría viejo con la primera venta del día.
- **Los handlers devuelven `T | DomainException`** y el controlador la lanza
  con `unwrap`. El filtro global escribe la respuesta de error.
- **Tokens sin estado.** No hay tabla de sesiones. Cerrar sesión borra las
  cookies en la web, pero un refresh token robado vale hasta que caduca
  (7 días). Para este alcance se aceptó; con usuarios reales habría que
  guardarlos y poder revocarlos.
- **Contraseñas:** se verifican los hashes que ya existen en `usuario`
  (PBKDF2-SHA256, `pbkdf2$iteraciones$sal$hash`) en tiempo constante. Si el
  correo no existe se calcula igual un hash señuelo, para que el tiempo de
  respuesta no revele qué cuentas existen.

## El modelo, en TypeScript

`domain/services/lightgbm-forest.ts` recorre los 139 árboles del volcado JSON
de LightGBM con sus reglas de valores faltantes. `domain/services/features.ts`
replica `training/src/features.py` con las operaciones en el mismo orden. Los
tests comparan ambos lados sobre 440 revisiones exportadas por Python (11 sin
consumo de 7 días, 46 sin el de 28): las 18 variables coinciden bit a bit y la
probabilidad difiere en menos de 1e-12. La API no entrena ni ajusta nada.

Para cambiar de modelo:

```powershell
cd training && .venv\Scripts\python src\train.py
cd .. && npm run model:update && npm run check
```

Si el entrenamiento cambió las variables, su orden o el tope de cobertura, la
API se niega a arrancar y lo dice.

**Límite que hay que conocer:** el modelo usa cantidades absolutas en la
unidad del producto. Con valores muy lejos de los que vio (10 000 naranjas
y 500 al día, cuando un lote real trae 20) la respuesta no tiene sentido,
aunque la regla de cobertura sí lo tenga. La web muestra la unidad de cada
producto para evitar ese error.

## Pruebas

```bash
npm test            # 70 pruebas unitarias
npm run test:e2e    # 18 pruebas HTTP con la aplicación entera
npm run check       # tipos + lint + las dos
```

- **Paridad con Python:** variables y probabilidades de las 440 filas.
- **Caso válido:** tomates que no se alcanzan a usar → `high`; leche que rota
  rápido → `low`.
- **Caso difícil:** sin historial de 28 días y revisado el mismo día que vence.
- **Entradas inválidas:** 7 casos de 400 y 422 por HTTP, 11 reglas de los
  objetos de valor.
- **Flujo completo:** login → lista → refresh → lista, más rutas protegidas,
  refresh token rechazado como access token y 404 en español.

Las pruebas e2e cambian los dos repositorios de Postgres por versiones en
memoria; el resto (guard, validación, filtro, CQRS, modelo real) es el mismo
que arranca `npm start`. Se comprobó que fallan al romper a propósito: la
fórmula de holgura, el lado por defecto de los valores faltantes, el hash
señuelo, el tipo de token del guard y la fecha de revisión.

**No verificado todavía:** el SQL de `OpenLotPostgresRepository` y
`UserPostgresRepository` contra la base restaurada (Docker no estaba
disponible). La prueba prevista: con la copia, `GET /lot-risk` debe devolver
los mismos 17 lotes abiertos que `training/data/open_lots.json`.
