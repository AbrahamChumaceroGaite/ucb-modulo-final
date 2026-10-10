# ml-api: servicio de predicción de vencimientos

Servicio NestJS que carga el modelo LightGBM entrenado en `../ml` y responde
qué lotes perecederos tienen riesgo de vencer con saldo. Lo consume la web de
Kaffehaus a través de su BFF, igual que a Spring.

## Arrancar

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run build
npm start                   # http://localhost:8082/api/v1
```

`JWT_SECRET` y `JWT_ISSUER` tienen que ser **los mismos que usa Spring**
(`seguridad.jwt.secreto-acceso` y `seguridad.jwt.emisor` en su
`application.yaml`): el servicio acepta exactamente los access tokens que
emite Spring y ninguno más. Los valores de `.env.example` son los de
desarrollo de Spring.

Con el modelo cargado, el servicio arranca con los 14 lotes abiertos al corte
del conjunto de datos ya evaluados. Se evalúan al arrancar, con el mismo
comando y el mismo modelo que un lote escrito a mano; el archivo
`modelo/lotes_vigentes.json` solo trae los datos crudos de cada lote.

## Endpoints

Contrato idéntico al de Spring: rutas en singular, respuesta sin envoltorio,
paginación `skip`/`limit` y errores `{ codigo, tipo, mensaje, timestamp }`.

| Método y ruta | Qué hace |
|---|---|
| `GET /salud` | Público. `{ "estado": "ok" }` |
| `GET /modelo-riesgo` | Versión, umbral, catálogo de insumos, calendario cubierto y métricas de prueba del modelo y de la regla |
| `GET /evaluacion-lote` | Lista paginada. Filtros: `search`, `riesgo` (`alto,vigilar,bajo`), `categoria`, `venceDesde`, `venceHasta`. Ordena por probabilidad descendente |
| `GET /evaluacion-lote/:id` | Una evaluación |
| `POST /evaluacion-lote` | Evalúa un lote con el modelo y guarda la respuesta. Reemplaza la evaluación anterior del mismo lote |
| `DELETE /evaluacion-lote/:id` | Quita la evaluación de la lista (204) |

Cuerpo de `POST /evaluacion-lote`:

```json
{
  "codigoInsumo": "FRU-FRE",
  "fechaIngreso": "2026-10-02",
  "fechaVencimiento": "2026-10-05",
  "fechaRevision": "2026-10-03",
  "cantidadInicial": 1.5,
  "cantidadRestante": 1.38,
  "stockPorDelante": 0,
  "consumo7d": 0.47,
  "consumo28d": 0.52
}
```

| Respuesta | Cuándo |
|---|---|
| 201 | Evaluado: `probabilidad`, `nivel`, `enRiesgo`, `reglaDeCobertura`, `diasCobertura`, `sobranteEstimado`… |
| 400 `Validación` | Forma incorrecta: fecha que no es `AAAA-MM-DD`, número negativo, campo desconocido |
| 401 `NoAutorizado` | Sin token, token caducado, firmado con otro secreto o de tipo `refresco` |
| 404 `NoEncontrado` | Id que no existe (o que no es un UUID) |
| 422 `ReglaDeNegocio` | Insumo que el modelo no conoce, queda más de lo comprado, el lote ya venció, fechas fuera del calendario cargado |

## Arquitectura

La de `ucb-smc-api-v2`, aplicada a un contexto:

```
src/
├─ main.ts, app.module.ts, configurar-app.ts
├─ libs/                       lo transversal (core.module, excepción, filtro, JWT, paginación)
└─ contexts/prediccion_vencimiento/
   ├─ domain/                  agregado, objetos de valor, entidad del modelo, servicios puros, puertos
   ├─ application/             comandos, consultas y sus handlers (CQRS), DTO, tipos, mapeo a respuesta
   ├─ infrastructure/          carga del modelo, repositorio en memoria, siembra del inventario
   └─ presentation/            controladores
```

Lo que se mantiene del SMC: contextos con sus cuatro capas, CQRS con
`@nestjs/cqrs`, puertos inyectados por token de texto, `DomainException`
devuelta en vez de lanzada y objetos de valor con `create()` que valida.

Lo que cambia, y por qué:

- **Sin envoltorio `{ success, code, data }`.** La web consume el contrato de
  Spring; con envoltorio tendría dos contratos. El controlador desenvuelve el
  resultado del handler (`desenvolver`) y el filtro global escribe el error
  como Spring.
- **Ids de texto (UUID)**, porque la web trata todo id como texto.
- **Repositorio en memoria** detrás de los mismos puertos que tendría uno de
  Prisma. Las evaluaciones son datos derivados (lote de Spring más respuesta
  del modelo) y el servicio todavía no tiene tabla propia. Pasar a base de
  datos es una clase nueva en `infrastructure/`.
- **Sin eventos de dominio.** Nadie los consumiría todavía, y escribirlos
  «por si acaso» sería código muerto.

## El modelo, en TypeScript y sin Python

`domain/services/bosque-lightgbm.ts` evalúa el volcado JSON de LightGBM
(`modelo/modelo_riesgo.json`, 148 árboles) siguiendo sus reglas de valores
faltantes. `domain/services/caracteristicas.ts` replica línea a línea
`ml/src/caracteristicas.py`. La prueba `caracteristicas.spec.ts` compara las
dos implementaciones sobre 440 revisiones exportadas por Python, 40 de ellas
con consumo faltante: las 18 variables coinciden bit a bit y la probabilidad
difiere en menos de 1e-12. Nada se entrena ni se ajusta en el servicio.

Para cambiar de modelo:

```bash
cd ../ml && python src/entrenar.py
cd ../ml-api && npm run modelo:actualizar && npm run check
```

Si el entrenamiento cambiara las variables o su orden, el servicio no arranca
y lo dice: compara la lista del modelo con la que calcula.

## Pruebas

```bash
npm test            # 32 pruebas: paridad con Python, árboles, objetos de valor, handler, repositorio
npm run test:e2e    # 10 pruebas HTTP con la aplicación entera, sin dobles
npm run check       # tipos + las dos
```

Las de extremo a extremo cubren el caso válido completo (registrar, leer,
buscar, quitar), un caso difícil (sin consumo de 28 días y el lote vence ese
día), entradas inválidas (400), reglas de negocio (422), el reemplazo de una
evaluación al revisar el mismo lote y la autenticación con tokens como los de
Spring (HS256 y HS384, rechazo del refresh token).
