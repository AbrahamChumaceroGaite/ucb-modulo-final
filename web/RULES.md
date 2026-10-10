# RULES.md — Kaffehaus Web

Este documento es la ley del proyecto. No es una guía de estilo opcional ni una
lista de buenas intenciones: es lo que se revisa en cada cambio y lo que el CI
hace cumplir donde puede.

Cada regla viene con **el motivo**. Una regla sin motivo se rompe en cuanto
alguien tiene prisa. Muchos de los motivos son fallos reales, medidos, de dos
proyectos que auditamos antes de empezar este: un frontend Angular de logística
(19.647 líneas) y una librería de componentes en Next (450 archivos). Cuando una
regla dice «porque ya pasó», pasó de verdad y está el número al lado.

---

## Índice

1. [Cómo usar este documento](#1-cómo-usar-este-documento)
2. [El contrato con la API](#2-el-contrato-con-la-api)
3. [Arquitectura y capas](#3-arquitectura-y-capas)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Nomenclatura](#5-nomenclatura)
6. [Sistema de diseño: tokens](#6-sistema-de-diseño-tokens)
7. [Reglas visuales](#7-reglas-visuales)
8. [Reglas de componentes](#8-reglas-de-componentes)
9. [Datos y estado](#9-datos-y-estado)
10. [Formularios](#10-formularios)
11. [Accesibilidad](#11-accesibilidad)
12. [Rendimiento](#12-rendimiento)
13. [Prohibiciones](#13-prohibiciones)
14. [Procedimiento de entrega](#14-procedimiento-de-entrega)
15. [Cómo crece el proyecto](#15-cómo-crece-el-proyecto)
16. [Autocrítica: lo que ya salió mal aquí](#16-autocrítica-lo-que-ya-salió-mal-aquí)

---

## 1. Cómo usar este documento

### 1.1 Antes de escribir código

Antes de crear un archivo, responde tres preguntas. Si no sabes la respuesta,
la respuesta está en este documento.

1. **¿A qué dominio pertenece?** Si no pertenece a ninguno, probablemente no
   debería existir todavía.
2. **¿A qué capa pertenece?** Dominio, infraestructura, aplicación o
   presentación. No hay una quinta.
3. **¿Ya existe algo que haga esto?** Busca antes de crear. La duplicación es
   el problema número uno que encontramos en los proyectos auditados.

### 1.2 Cuando una regla estorbe

Las reglas están para servir al proyecto, no al revés. Si una regla te impide
hacer algo razonable:

- **No la ignores en silencio.** Eso es exactamente cómo un proyecto acumula
  seis duplicaciones idénticas mientras su documentación dice que no duplica.
- Abre la discusión, cambia la regla en este archivo, y entonces escribe el
  código.

Una regla rota sin actualizar el documento convierte el documento en mentira.
En el proyecto Angular auditado, el encabezado de `persona.form.mapper.ts`
afirma que el teléfono vacío «se omite en vez de viajar como cadena vacía», y
tres líneas de código más abajo manda `''`. Eso es peor que no documentar.

### 1.3 Qué comprueba la máquina y qué comprueba una persona

| Lo comprueba el CI | Lo comprueba una persona |
|---|---|
| Tipos (`tsc --noEmit`, sin excepciones) | Que el nombre diga lo que la cosa hace |
| Regla de dependencias (`eslint-plugin-boundaries`) | Que no exista ya algo parecido |
| Ciclos de importación (`import/no-cycle`) | Que el componente no tenga dos responsabilidades |
| `any` y variables sin usar | Que el texto de la interfaz suene humano |
| Tokens de diseño declarados (`scripts/audit-tokens.mjs`) | Que la pantalla sirva para lo que dice servir |
| Código sin consumidor (`scripts/audit-muertos.mjs`) | Que lo que sí tiene consumidor merezca existir |
| Comportamiento (`vitest run`) | Que el comportamiento probado sea el que hace falta |

`npm run check` es lo que tiene que pasar en verde antes de dar nada por
hecho: tipos, lint, tokens, código muerto y pruebas, en ese orden.

---

## 2. El contrato con la API

El backend es **Spring Boot 4 / Java 21**, en otro repositorio, más el servicio
de predicción de §2.10. El frontend no manda en el contrato: lo consume. Todo
lo de esta sección está verificado leyendo el código del backend, no su
documentación.

### 2.1 Forma de las rutas

```
/api/v1/<recurso-en-singular>
```

Es **singular**: `/api/v1/producto`, `/api/v1/usuario`, `/api/v1/categoria`.
No `/productos`. Escribirlo en plural devuelve 404.

### 2.2 No hay envelope

Una respuesta correcta devuelve el DTO directamente. **No** hay
`{ success, code, data, message }`.

```jsonc
// GET /api/v1/producto/abc-123
{ "id": "abc-123", "nombre": "House Espresso", "precio": 45.5, ... }
```

> **Motivo de la regla:** en el proyecto Angular auditado, el frontend declaraba
> `code: string`, el backend enviaba `code: number` y los dobles de prueba
> devolvían `'OK'`. Tres verdades del mismo campo conviviendo. Aquí el cliente
> HTTP **no desenvuelve nada**, porque no hay nada que desenvolver.

### 2.3 Paginación

Entrada por query string, **`skip` y `limit`**, no `page`:

```
GET /api/v1/producto?skip=0&limit=10&search=espresso
```

Salida:

```ts
{ data: T[], skip: number, limit: number, total: number, hasMore: boolean }
```

El número de página, si hace falta mostrarlo, se **deriva** de `skip / limit`.
No se guarda aparte: dos fuentes para el mismo dato se desincronizan.

### 2.4 Errores

```ts
{ codigo: number, tipo: string, mensaje: string, timestamp: string }
```

`mensaje` es texto para la persona, ya en español, escrito por el backend.
**El frontend no reescribe mensajes de error del servidor.** Los muestra.

### 2.5 Autenticación

| Ruta | Qué hace |
|---|---|
| `POST /api/v1/auth/login` | `{ email, password }` → `{ usuario, accessToken, refreshToken }` |
| `POST /api/v1/auth/google` | `{ googleToken }` → lo mismo que `/login` |
| `POST /api/v1/auth/refresh` | `{ refreshToken }` → `{ accessToken }` |

El usuario del token trae exactamente cuatro campos:

```ts
{ usuarioId: string, nombreCompleto: string, rolId: string, rolNombre: string }
```

- Se entra con **correo**, no con CI ni con nombre de usuario.
- El rol viaja **por nombre** (`"Administrador"`), leído de la base en cada
  login. **No hay catálogo de roles en el código del frontend.**
- **No existe endpoint de logout.** Cerrar sesión es borrar la cookie.
- **Google acredita, no da acceso.** `/auth/google` verifica el `id_token` y
  busca el correo en `usuario`; si no existe, responde 401 y **no crea nada**.
  El `id_token` lo emite Google en el navegador, así que hace falta
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` además del `GOOGLE_CLIENT_ID` del servidor, y
  tienen que ser el mismo. Sin él la pantalla dice qué falta en vez de pintar
  un botón que no puede funcionar.

#### Los ids de rol están escritos a mano, y es deuda

`shared/config/roles.ts` guarda los UUID de `Operador` y `Administrador`.

Hace falta: sin el `id` no se puede crear un usuario, y no hay un catálogo que
el frontend pueda pedir hoy. Pero `auth.md` es explícito en que **los roles son
filas de la tabla y no hay enum en el código**, así que esto es una comodidad
del cliente, no una copia del modelo.

Dos reglas que lo mantienen honesto mientras dure:

- **El nombre que se pinta sale siempre de `rol.nombre` de la respuesta**,
  nunca del archivo. Si alguien renombra la fila, la pantalla lo refleja.
- **Nadie escribe un UUID suelto.** Todo pasa por `ROLES` / `ROL_ID`, para que
  el día que exista `GET /api/v1/rol` se sustituya un archivo y nada más.

#### El selector de perfil no es un permiso

La pantalla de acceso deja elegir entre **Administrador** y **Operador**. Eso es
una **preferencia de destino**, no una credencial:

- `POST /auth/login` solo acepta `{ email, password }`. El perfil **no se
  envía**: `credencialesSchema` describe lo que viaja y `accesoSchema` lo que
  rellena el formulario. Son dos esquemas por esa razón exacta.
- Quien manda es `rolNombre`, que el servidor escribe en el token. Si lo
  elegido y lo real no coinciden, **gana el real**: se navega a la pantalla que
  le toca y se avisa en el mismo aviso de bienvenida.
- La tabla `rol` no trae filas sembradas, así que `perfilDeRol()` reconoce por
  palabra y **devuelve `null` si no reconoce nada**. Con `null` no se afirma
  ninguna discrepancia: no hay base para afirmarla.

> **Prohibido** usar el perfil elegido para ocultar o mostrar nada que importe.
> Autorizar en el cliente es decorar; la comprobación está en Spring.

### 2.6 El token nunca llega al navegador

El backend espera `Authorization: Bearer` y tiene `allowCredentials: false`, así
que el navegador no puede mandarle cookies. La solución no es guardar el token
en `localStorage`.

**Next actúa como BFF.** El token vive en una cookie `httpOnly` del dominio de
Next, y los Route Handlers de `app/api/` reenvían a Spring añadiendo la cabecera.

```
Navegador --(cookie httpOnly)--> Next Route Handler --(Bearer)--> Spring
```

> **Motivo:** el proyecto Angular auditado guarda los tokens en `localStorage`,
> donde cualquier XSS los lee. Aquí el navegador nunca ve el token.

### 2.7 Verbos

Solo **GET, POST, PATCH, DELETE**. `shared/api/http-client.ts` no expone `put`,
así que escribirlo no compila.

> **Nota sobre el backend:** hoy usa `@PutMapping` para actualizar, aunque la
> semántica es parcial (`null` significa «no cambies»). El frontend manda PATCH.
> Si la API rechaza el verbo, se ajusta en un único sitio: el cliente HTTP.

### 2.8 Actualizaciones parciales

Una actualización manda **solo lo que cambió**. Nunca el registro entero.

```ts
const cambios = toPatch(original, valores); // shared/lib/to-patch.ts
if (Object.keys(cambios).length === 0) return; // sin cambios no se llama
```

> **Motivo:** una petición que no cambia nada gasta un viaje y dispara un aviso
> de éxito por algo que no ocurrió.

**Cuidado con vaciar campos.** `undefined` significa «no tocado»; `null`
significa «bórralo». Son cosas distintas y el esquema debe declararlo.

> **Motivo:** en el proyecto Angular auditado, `aActualizarRecorrido` filtra con
> `if (nuevo && ...)`, así que borrar una fecha **nunca se envía**. Son siete
> fechas por envío que se pueden poner y jamás quitar, y no hay ni un test que
> lo cubra.

### 2.9 Identificadores y dinero

- Los `id` son **`string`** (UUID). Nunca `number`.
- El precio llega como número JSON desde un `BigDecimal` de Java. Para mostrar,
  se formatea con `formatearMoneda`. **Nunca** se hace aritmética de dinero en
  el frontend: los totales los calcula el backend.

### 2.10 Un segundo servidor: el de predicción

La pantalla de vencimientos no habla con Spring: habla con `ml-api/`, un
servicio NestJS que carga el modelo de riesgo y lo ejecuta. Para el navegador
**no hay dos backends**, porque las reglas de esta sección valen igual para él:

- Rutas en singular bajo `/api/v1`: `/evaluacion-lote`, `/modelo-riesgo`.
- Sin envoltorio, paginación `skip`/`limit` con `{ data, skip, limit, total,
  hasMore }` y errores `{ codigo, tipo, mensaje, timestamp }`.
- Valida **el mismo access token** que Spring (mismo secreto, emisor
  `kaffehausv4`, `tipo: acceso`), así que el BFF lo reenvía igual.

Quién sirve qué se decide en **un solo sitio**: `RECURSOS_DE_PREDICCION` en
`shared/config/env.ts`, por el primer tramo de la ruta. El destino es
`ML_API_URL`. Ninguna feature sabe a qué puerto va su petición.

> **Motivo:** el servicio de ejemplo del que salió su arquitectura
> (`ucb-smc-api-v2`) envuelve sus respuestas en `{ success, code, data }`. Si
> se hubiera copiado eso, esta web tendría dos contratos y el cliente HTTP
> desenvolvería unas respuestas sí y otras no — el fallo exacto de §2.2. El
> servicio adopta el contrato de quien lo consume, no al revés.

---

## 3. Arquitectura y capas

### 3.1 Las cuatro capas

Son las mismas que usa el backend (`Application`, `Domain`, `Infrastructure`,
`Presentation`), para que un archivo de aquí y uno de allá se lean igual.

| Capa | Responsabilidad | Puede importar de |
|---|---|---|
| **domain** | Qué es la cosa y qué es válido | `shared/lib` y nada más |
| **infrastructure** | Hablar con el exterior (HTTP) | `domain`, `shared` |
| **application** | Casos de uso. Un archivo por acción | `domain`, `infrastructure`, `shared` |
| **presentation** | Cómo se ve | `application`, `domain`, `shared` |

**`domain` no importa React, ni `next/*`, ni el cliente HTTP.** Es la capa que
se prueba sin montar nada.

### 3.2 La regla de dependencias

```
app  →  features (por su index.ts)  →  shared
                 ↓
   presentation → application → infrastructure → domain
```

Tres reglas, y las comprueba `eslint-plugin-boundaries`:

1. **Las importaciones van hacia abajo.** Nunca hacia arriba.
2. **Una feature nunca importa de otra feature.** Si dos necesitan lo mismo,
   eso baja a `shared/`.
3. **`shared/` no sabe nada del negocio.** Si un archivo de `shared` menciona
   «producto», está en el sitio equivocado.

### 3.3 Dependencias circulares: cero, y garantizado

`import/no-cycle` está en `error`. Además hay una regla estructural que las
vuelve casi imposibles:

> **El `index.ts` de una feature se consume desde fuera, nunca desde dentro.**
>
> Dentro de la feature, los archivos se importan por ruta directa
> (`../domain/producto.schema`). Así el barril es una hoja del grafo y no puede
> cerrar un ciclo.

Y el barril exporta **solo lo que `app/` necesita**: la vista y los tipos. No
los hooks, no la infraestructura, no los componentes internos.

### 3.4 Qué NO es una capa

- **No hay `core/`.** Es un artefacto de Angular, donde `CoreModule` se importa
  una vez y `SharedModule` en todas partes. En React no hay módulos: esa
  distinción no significa nada. Hay `shared/`, y ya.
- **No hay `entities/`, `widgets/` ni `views/`** todavía. Se crean cuando haya
  tres consumidores, no antes (ver §15).
- **No hay `helpers/`, `utils/` genéricos ni `common/`.** Una carpeta que acepta
  cualquier cosa acaba conteniendo cualquier cosa. Cada función va donde
  pertenece, con un nombre que la describe.

---

## 4. Estructura de carpetas

```
web/
├─ app/                              Rutas, layouts, metadata, BFF. Sin negocio
│  ├─ layout.tsx
│  ├─ globals.css                    ÚNICO archivo CSS del proyecto
│  ├─ page.tsx                       Landing pública + acceso
│  ├─ _data/                         Contenido de la portada
│  ├─ (panel)/                       Grupo autenticado
│  │  ├─ layout.tsx
│  │  ├─ productos/page.tsx
│  │  ├─ ventas/page.tsx
│  │  └─ usuarios/page.tsx
│  ├─ (dev)/ui/                      Demo UI. 404 en producción
│  │  ├─ page.tsx
│  │  ├─ _components/                Piezas de composición del catálogo
│  │  ├─ _sections/                  Una sección por archivo, solo vista
│  │  └─ _data/                      Los datos de ejemplo de cada sección
│  └─ api/                           BFF: el token no cruza al navegador
│     ├─ auth/{login,refresh,logout}/route.ts
│     └─ proxy/[...path]/route.ts
│
├─ src/
│  ├─ features/<dominio>/
│  │  ├─ domain/                     schema + mapper
│  │  ├─ infrastructure/             api + keys de caché
│  │  ├─ application/                un use-*.ts por caso de uso
│  │  ├─ presentation/
│  │  │  ├─ <x>-<accion>.view.tsx    la pantalla: usa hooks, compone
│  │  │  └─ components/              reciben props, emiten callbacks
│  │  └─ index.ts                    puerta pública
│  │
│  └─ shared/
│     ├─ api/                        http-client, errores, paginación
│     ├─ ui/primitives/              átomos, agrupados por para qué sirven
│     │  ├─ actions/                 button, expandable-button, icon-action
│     │  ├─ fields/                  field, input, select, toggle, date-picker…
│     │  ├─ overlays/                dialog, drawer, popover, tooltip
│     │  ├─ navigation/              breadcrumbs, pagination, stepper
│     │  ├─ feedback/                skeleton, dots, progress-bar
│     │  ├─ display/                 tag, avatar, filter-chips
│     │  ├─ theme/                   theme-toggle
│     │  └─ index.ts                 el ÚNICO punto de entrada desde fuera
│     ├─ ui/patterns/                bloques compuestos sin dominio
│     │  ├─ shell/                   header-shell, app-header, bottom-nav…
│     │  ├─ cards/                   entity-card, add-card, card-grid, stat-card…
│     │  ├─ tables/ forms/ dialogs/ charts/ feedback/ help/
│     │  └─ index.ts
│     ├─ lib/                        funciones puras + tour
│     └─ config/                     env, rutas, variantes
│
├─ scripts/
│  ├─ audit-tokens.mjs              Tokens declarados y radios permitidos
│  └─ audit-muertos.mjs             Huérfanos y exportaciones sin consumidor
├─ proxy.ts                         Guard de rutas y cierre del catálogo
├─ RULES.md
└─ eslint.config.mjs
```

### 4.0 Las carpetas de `shared/ui` y por qué existen

Veinticuatro archivos en una carpeta plana obligan a leer los veinticuatro
nombres para encontrar uno. Agrupados por **para qué sirven**, se descarta una
carpeta entera de un vistazo.

**Desde fuera de `shared/ui` solo se importa el barril.** Nunca
`@/shared/ui/patterns/shell/app-header`. Así los grupos se reorganizan sin
tocar una sola feature — que es exactamente lo que hicimos al crearlos.

> **Aviso de una trampa real:** `PanelShell` estaba fuera del barril y se
> importaba por ruta. Al mover los archivos, ese import se rompió y fue el
> único que hubo que arreglar a mano. Un archivo que se salta el barril es un
> archivo que rompe cada vez que algo se mueve.

### 4.1 `app/` no tiene lógica

Un `page.tsx` monta la vista y nada más:

```tsx
export default function Page() {
  return <ProductoListView />;
}
```

> **Motivo:** en el proyecto Angular auditado, las seis páginas contenedoras
> acabaron con el mismo manejador de menú copiado **byte a byte en las seis**.
> Si la ruta no tiene sitio donde acumular, no acumula.

### 4.2 `primitives` frente a `patterns`

| | `primitives/` | `patterns/` |
|---|---|---|
| Qué es | Un átomo | Una composición |
| Ejemplos | `button`, `input`, `tag` | `data-table`, `page-header`, `empty-state` |
| Sabe de dominio | No | No |
| Tiene estado propio | El mínimo | Puede orquestar varios átomos |

**Lo que sabe qué es un producto no va en `shared/`**, aunque lo usen dos
pantallas. Se queda en su feature.

### 4.3 Los datos no viven en un `.tsx`

**Un `.tsx` declara componentes. Nada más.** Cualquier constante de módulo que
sea *contenido* o *tabla de consulta* se va a un `.ts` hermano llamado
`<archivo>.data.ts`, y los datos de ejemplo del catálogo a `_data/`.

| Se queda en el `.tsx` | Se va al `.data.ts` |
|---|---|
| El componente | Listas de registros, series, fixtures |
| Sus props y su tipo | Tablas de consulta (`ACENTOS`, `TRAMOS`, `ICONOS`) |
| Constantes de una sola línea usadas una vez | Cualquier cosa de más de cinco líneas que no sea JSX |

> **Motivo:** una sección del catálogo tenía 80 líneas de datos antes del
> primer componente, y había que bajarlas enteras para llegar a lo que la
> sección de verdad hace. El archivo decía ser una vista y era medio almacén.
>
> **Y el efecto secundario que importa:** con los datos fuera, el diff de un
> cambio de contenido no toca el archivo de maquetación, y al revés.

### 4.4 Una feature es un **contexto**, no un agregado

`features/personal/` contiene `usuario` **y** `cliente`. No es una excepción:

- En la base los dos cuelgan de la misma fila de `persona` por `id_persona`.
- El backend los agrupa en el mismo bounded context, `Personal`.
- Se miran en la misma pantalla, con un interruptor entre las dos.

Separarlos en `features/usuarios/` y `features/clientes/` habría obligado a
duplicar `personaSchema`, `PersonaFields` y los cuatro campos que comparten —o
a inventar una tercera carpeta para compartirlos—. Un mes después, uno validaría
el teléfono y el otro no.

> **La regla:** una feature agrupa lo que **cambia junto**. Si dos agregados
> comparten modelo y pantalla, comparten feature. Si solo comparten un tipo,
> ese tipo sube a `shared` y las features siguen separadas.

**La ruta no tiene por qué llamarse igual que la feature.** `/usuarios` lleva a
`personal` porque es lo que dice el menú; la pestaña de clientes es
`?tipo=clientes`, no otra ruta. Son dos vistas de lo mismo.

### 4.5 Un archivo, una cosa

- Un archivo de `application/` = **un caso de uso**.
- Un archivo de `components/` = **un componente**.
- Nada de `hooks.ts` con ocho hooks dentro ni `utils.ts` cajón de sastre.

---

## 5. Nomenclatura

### 5.1 Tabla

| Elemento | Convención | Ejemplo |
|---|---|---|
| Carpetas | `kebab-case`, español, plural para el dominio | `productos/`, `presentation/components/` |
| Archivos | `kebab-case` + sufijo de rol | `producto.schema.ts`, `producto-table.tsx` |
| Casos de uso | `use-<verbo>-<entidad>.ts` | `use-create-producto.ts` |
| Vistas | `<entidad>-<accion>.view.tsx` | `producto-list.view.tsx` |
| Componente (export) | `PascalCase` | `ProductoEstadoTag` |
| Hook (export) | `camelCase` con `use` | `useUpdateProducto` |
| Tipos | `PascalCase` | `type Producto` |
| Esquemas Zod | `camelCase` + `Schema` | `productoSchema` |
| Funciones y variables | `camelCase` | `aActualizacion` |
| Constantes | `SCREAMING_SNAKE_CASE` | `CATEGORIAS_PRODUCTO` |
| Claves de caché | `camelCase` + `Keys` | `productoKeys` |
| `snake_case` | **Nunca en TypeScript** | — |

### 5.2 Idioma

| Qué | Idioma | Ejemplos |
|---|---|---|
| **Carpetas y archivos** | **Inglés, siempre** | `shared/ui/primitives/fields/`, `patterns/shell/`, `_data/`, `*.data.ts` |
| Nombres de dominio | Español | `producto`, `usuarios`, `precio`, `borrado` |
| Vocabulario técnico | Inglés | `use-create-`, `.view.tsx`, `schema`, `mapper`, `props` |
| Identificadores, comentarios y texto de interfaz | Español | `nivelDeStock`, `TONO_POR_NIVEL`, «Hay que reponer» |

**Las carpetas no son una excepción negociable.** El árbol ya nace en inglés
—`app`, `features`, `domain`, `infrastructure`, `application`, `presentation`,
`shared`, `lib`, `config`— y meter `acciones/` al lado de `actions` deja el
proyecto a medias en dos idiomas. Pasó: los grupos de `shared/ui` nacieron en
español y hubo que renombrarlos enteros.

La única excepción es el **nombre de un dominio**, que lo dicta el negocio:
`features/productos/`, no `features/products/`. Si el negocio dice
«productos», la carpeta dice productos.

Lo que no se hace nunca es mezclar dentro de la misma palabra:
`useCrearProduct` está mal; `useCreateProducto` está bien.

### 5.3 El guion bajo de `app/` no es un estilo nuestro

`app/(dev)/ui/_sections/`, `_components/`, `_data/` llevan guion bajo porque
**Next lo exige**: sin él, cada carpeta dentro de `app/` se convierte en una
ruta. `_sections` sería `/ui/sections`. El guion bajo la marca como privada.

Por eso **no aparece en `src/`**: ahí nada es una ruta, así que una carpeta
`data/` no tiene con qué confundirse y el guion bajo sería ruido copiado de
otro sitio.

| Dónde | Cómo se separa lo privado | Por qué |
|---|---|---|
| `app/` | `_data/`, `_sections/`, `_components/` | Convención del marco: evita que sea una ruta |
| `src/features/<dominio>/` | Por **capa**: `domain/`, `infrastructure/`, `application/`, `presentation/` | La capa ya dice qué puede importar a qué, y el linter lo aplica |
| `src/shared/ui/` | Por **para qué sirve**: `fields/`, `overlays/`, `cards/` | No hay capas dentro de `shared`; lo que hay es familias |
| Junto a cualquier `.tsx` | `<archivo>.data.ts` | Datos y tablas fuera del componente (§4.3) |

La consistencia no es «el mismo nombre en todas partes»: es **que la razón de
cada nombre sea la misma**. Aquí la razón es siempre la misma pregunta —qué
impide que esto se mezcle con lo de al lado— y la respuesta cambia según dónde
estés: el marco en `app/`, la capa en una feature, la familia en `shared`.

### 5.4 Nombres que dicen la verdad

- `productos` porque el negocio dice «productos». Si dijera «la carta», la
  carpeta sería `carta`.
- Un booleano se llama como lo que afirma: `vendible`, `borrado`, `abierto`.
  No `flag`, no `estado2`.
- Nada de `data`, `info`, `item`, `manager`, `helper`, `handler` a secas.

---

## 6. Sistema de diseño: tokens

### 6.1 Un solo sitio

**Todos los tokens viven en `app/globals.css`, dentro de `@theme`.**

- **No existe `tailwind.config.ts`.** En Tailwind v4 ese archivo solo se lee con
  `@config`, y sin él es código muerto.
- **No existe ningún otro archivo `.css` o `.scss`** en el proyecto.

> **Motivo:** la librería auditada tenía un `tailwind.config.ts` de 90 líneas
> completamente muerto, con monólogo de depuración dentro, y **34 tokens CSS
> usados y nunca declarados** (209 usos). Su botón primario se renderizaba
> transparente sobre texto blanco, en su propia página de botones.

### 6.2 Una sola sintaxis

```tsx
✅ className="bg-primary text-on-primary rounded-md"
❌ className="bg-[var(--color-primary)]"
❌ className="bg-(--color-primary)"
```

> **Motivo:** la librería auditada usa las dos formas —903 y 499 veces— y hay
> seis archivos que mezclan ambas en el mismo fichero.

### 6.3 El CI lo comprueba

`scripts/audit-tokens.mjs` recorre el código, extrae cada token usado y falla si
alguno no está declarado en `@theme`. Se ejecuta en `npm run check`.

### 6.4 Paleta

Los nombres son los de `DESIGN.md`, tal cual, para que diseño y código hablen
igual.

| Token | Para qué |
|---|---|
| `surface`, `surface-container`, `surface-container-high` | Fondos, por capas |
| `on-surface`, `on-surface-variant` | Texto principal y secundario |
| `outline`, `outline-variant` | Bordes y divisores |
| `primary` / `on-primary` | Acción principal, marca |
| `secondary` / `on-secondary` | Acento cálido: pedidos, destacados |
| `success`, `warning`, `error` + sus `on-` | Estados |

**Nunca un color literal en un componente.** Ni `#fff`, ni `bg-red-500`, ni
`text-gray-400`.

> **Motivo:** en la librería auditada, `badge.tsx` usa tokens en unas variantes
> y `bg-green-500`, `bg-gray-500`, `bg-red-600`, `bg-cyan-500` en otras. El
> mismo archivo, dos sistemas.

---

## 7. Reglas visuales

### 7.1 Tamaños: `sm` por defecto, `md` como excepción

```ts
medida?: 'sm' | 'md'   // y nada más
```

**Prohibido `lg`, `xl` y cualquier cosa mayor** en componentes. La interfaz es
densa y de trabajo; un botón gigante no aporta nada.

Y dentro de lo permitido, **`sm` es el valor por omisión** de todo control:
botón, entrada, desplegable, segmentado, expandible. Quien quiera `md` lo
escribe, y solo debería escribirlo para el control que manda en su zona —el
botón de enviar de un formulario, la acción única de una pantalla—.

| | Alto | Texto |
|---|---|---|
| `sm` (por defecto) | 32 px | 12 px |
| `md` | 40 px | 14 px |

> **Motivo:** la escala existía pero el valor por omisión era `md`, así que
> una pantalla entera salía en tamaño grande sin que nadie lo hubiera pedido.
> El valor por omisión es la decisión que más veces se aplica; ponerlo mal
> cuesta más que cualquier regla escrita.

### 7.2 Radios: nada cuadrado

| Token | Valor | Uso |
|---|---|---|
| `rounded-xs` | 0.3125rem | **Solo** controles de 16–20 px: casillas. Con `sm` se volverían círculos y dejarían de distinguirse de un radio |
| `rounded-sm` | 0.5rem | Celdas densas, chips pequeños |
| `rounded-md` | 0.75rem | Entradas, botones `sm` |
| `rounded-xl` | 1.5rem | Tarjetas, paneles, botones `md` |
| `rounded-full` | 9999px | Pastillas, avatares, menú flotante, **todo botón de solo icono** |

- **No existe `rounded-lg`.** Está fuera de la escala a propósito.
- **Nunca `rounded-none`.** Nada es cuadrado en Kaffehaus.
- Un botón va **un escalón por encima** del radio que le tocaría por tamaño, y
  si solo lleva icono es un **círculo exacto**.

**Una superficie grande es `xl`; un control es `md`.** Sin excepciones:

| `rounded-xl` | `rounded-md` |
|---|---|
| Tarjetas, paneles, secciones con borde | Entradas, desplegables, botones `sm` |
| Diálogos, drawers, gráficos, estados vacíos | Miniaturas, menús flotantes, avisos |

> Se mezclaron durante una versión: las tarjetas pasaron a `xl` y los paneles
> que las contienen se quedaron en `md`. Dos radios para el mismo tipo de
> superficie en la misma pantalla. No lo cazó ningún script —los dos son
> válidos por separado—, lo cazó mirar.

> **Cuidado con el círculo que no lo es:** el botón expandible colapsaba a un
> óvalo porque conservaba su `gap` interno con el texto a cero de ancho. Si un
> control tiene que ser circular en reposo, el espacio va **dentro** del
> elemento que colapsa (`padding`), nunca en un `gap` del contenedor.

### 7.3 Tipografía

- **Inter** para todo el panel: datos, formularios, tablas, botones.
- **Playfair Display** solo en la landing y en títulos de nivel display.
- Tablas y datos numéricos usan `tabular-nums` para que las cifras alineen.

### 7.4 Elevación

- **Panel: plano.** Jerarquía por capas de superficie y bordes de 1px. Sin
  sombras.
- **Landing: sombra ambiental** tintada en espresso, nunca negra pura.

### 7.5 Sin ruletas

**Prohibidos los spinners.** Un círculo girando no dice cuánto falta ni qué está
cargando.

- Carga de contenido → **skeleton** con la forma del contenido real.
- Acción en curso (botón) → **puntos animados**.

> **Motivo:** el skeleton reserva el espacio exacto, así que la pantalla no salta
> cuando llegan los datos. Un spinner deja un hueco que luego se llena de golpe.

### 7.6 La firma visual de Kaffehaus

Lo que hace que una tarjeta se vea de este proyecto y no de una plantilla:

1. **Icono de fondo**, grande, girado entre -12° y 12°, con opacidad del 5 % al
   10 %, recortado por el borde de la tarjeta.
2. **Borde de acento** de 2px a la izquierda, del color del estado.
3. **Etiqueta de categoría** en `label-caps`: 12px, semibold, `tracking` amplio,
   en mayúsculas.
4. **Acciones que aparecen al pasar el cursor**, cada una con su color: ver es
   neutro, editar es primario, eliminar avisa. En táctil están siempre visibles.

> **Motivo de la última:** una fila con tres botones de colores permanentes
> parece un semáforo. Y en pantalla táctil no hay «pasar el cursor», así que
> ocultarlas allí las haría inalcanzables.

### 7.7 Sin barra lateral

La navegación del panel es un **menú flotante centrado abajo**, en todas las
medidas. No hay sidebar, ni colapsable ni fija.

### 7.8 Las etiquetas son diminutas

Un chip **acompaña** a un dato; no compite con él.

| | Texto | Alto |
|---|---|---|
| `<Tag>` | 11 px | 18 px |
| Chip de filtro | 11 px | 24 px |
| Chip aplicado | 11 px | 20 px |

> **Motivo:** con el tamaño de un botón pequeño, una rejilla de tarjetas se
> leía como una rejilla de botones y la vista no sabía dónde posarse. Las
> etiquetas son la única excepción al mínimo táctil de 44 px, porque **no son
> pulsables**; el chip de filtro, que sí lo es, conserva su zona de toque.

### 7.9 Objetivos táctiles

Todo lo pulsable mide **mínimo 44×44 px** en pantallas sin puntero fino:

```css
@media (hover: none) { /* los iconos suben de 32 a 44 */ }
```

---

## 8. Reglas de componentes

### 8.1 Un componente no se puede esquivar

**No existen clases CSS globales que repliquen un componente.** No hay
`.kh-button` en `globals.css`. Si quieres un botón, importas `<Button>`.

> **Motivo:** el proyecto Angular auditado tiene un componente de botón y aun
> así **99 usos de la clase cruda `est-button` frente a 19 del componente**. Si
> la clase existe, se usa.

### 8.2 Vocabulario cerrado

El tono sale de `shared/config/variants.ts` y de ningún otro sitio.

```ts
type Tone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
```

Nadie inventa `error` si ya existe `danger`, ni `critical`, ni `terciary`. La
lista es cerrada de verdad: `TONO_CLASES` es un `Record<Tone, …>`, así que un
tono sin clases declaradas **no compila**.

El tamaño lo declara cada componente en su prop `medida` (`'sm' | 'md'`), y el
radio lo declara `globals.css`. No hay un array en `variants.ts` repitiendo
esas dos escalas: lo hubo, nadie lo importaba y solo podía divergir de la
fuente de verdad.

> **Motivo:** la librería auditada tiene `danger` en 11 componentes, `error` en
> 8 y `critical` en 2 para el mismo estado; y `default`, `md` y `compact` para
> el mismo tamaño. Con 45 componentes, eso son tres vocabularios compitiendo.

### 8.3 Contrato de props

- **Controlado por defecto:** `value` + `onChange`. Un componente **no** guarda
  en estado interno una copia de una prop.
  > **Motivo:** el `Checkbox` de la librería auditada mantiene `internalChecked`
  > junto a la prop `checked`, y eso lo hace incompatible con React Hook Form.
- **Booleanas sin prefijo y en positivo:** `open`, `disabled`, `loading`.
  Nunca `isOpen` conviviendo con `open`, ni `unread` conviviendo con `isRead`.
- **`forwardRef` en toda primitiva de formulario**, para que RHF pueda
  registrarla.
- **Composición antes que variante.** Si un componente pasa de seis variantes,
  se parte en dos.
- **Nada de `any`.** Y nada de `as unknown as`, que es lo mismo con otra cara.
  > **Motivo:** el proyecto Angular auditado tiene 0 `any` —su linter lo
  > prohíbe— y **10 `as unknown as`**, ocho de ellos el mismo patrón repetido en
  > las seis páginas. La regla se cumplía; la seguridad de tipos no.

### 8.4 Contenedor y presentación

> **La `*.view.tsx` es la única que llama a hooks de datos.**
> Lo de `components/` recibe props y emite callbacks.

> **Motivo:** el `Table` de la librería auditada filtra en cliente **y** avisa
> al padre con `onSearch`. Un listado con búsqueda de servidor se filtra dos
> veces, y las filas cuya coincidencia esté en un campo que no es columna
> desaparecen.

### 8.5 La tabla y las listas no tienen estado propio

Orden, página, búsqueda y filtros **viven en la URL**. El componente los recibe
y emite la intención de cambiarlos.

Así, compartir un enlace filtrado funciona, recargar mantiene el estado, y no
hay dos copias del mismo dato.

> **Motivo:** en el proyecto Angular auditado, cuatro features guardan `orden` y
> `direccion` en su store, con un tipo `OrdenX` dedicado, **y ninguna tiene una
> acción para cambiarlos**. Es estado congelado desde el día uno.

### 8.6 Un solo paginador

`<Pagination>` sirve a la tabla y a la rejilla de tarjetas. No se escribe uno
por pantalla.

> **Motivo:** el proyecto auditado tiene **cuatro copias byte a byte idénticas**
> del paginador —marcado y getters— porque cada listado se hizo el suyo.

### 8.7 Un solo estado vacío

`<EmptyState>` recibe título y mensaje. La lógica de «no hay nada» frente a «no
hay resultados para tu búsqueda» la decide la vista, no el componente.

> **Motivo:** cinco copias de `tituloVacio`/`mensajeVacio` en el proyecto
> auditado, y con textos distintos para el mismo estado: «Dados de baja» en dos
> pantallas, «Desactivados» en otras dos.

### 8.8 El diálogo no se cierra por accidente

**Un `<Dialog>` no cierra al pulsar fuera.** El velo apaga el fondo y no
escucha nada. Se sale por `Escape`, por la equis o por los botones del pie.

> **Motivo:** los diálogos de este sistema llevan formularios y confirmaciones.
> Un clic desviado tira lo escrito, sin aviso y sin deshacer.

El `<Drawer>` **sí** cierra al pulsar fuera, porque sirve para mirar un
registro, no para escribirlo. La diferencia no es un capricho de cada
pantalla: la decide el componente, y por eso son dos componentes.

### 8.9 Dos paneles laterales, y cuándo va cada uno

| | `<Drawer>` | `<DrawerPush>` |
|---|---|---|
| Fondo | Velado y desenfocado | Intacto |
| Contenido | Tapado | Se estrecha |
| Sirve para | Mirar un registro a fondo | Comparar el panel con la lista |
| Cierra al pulsar fuera | Sí | No hay fuera |
| Por debajo de 1024 px | Hoja desde abajo | Hoja desde abajo, igual |

Los dos redondean su canto interior. Un panel a escuadra sería lo único
cuadrado que quedaría en todo el producto.

#### En móvil no son paneles: son hojas

Por debajo de `sm` **los dos** suben desde abajo, ocupan el ancho entero,
curvan solo sus esquinas de arriba y llevan **tirador** —la rayita—. Se
arrastran: bajar 80 px cierra.

- El tirador es un `<div>`, no un botón: no hace nada al pulsarlo, solo se
  arrastra, y un botón que ignora el Enter es una promesa falsa.
- **El gesto nunca es la única salida.** `Escape`, la equis y el velo siguen
  ahí. Un gesto sin equivalente pulsable deja fuera a quien no puede hacerlo.
- Se usan eventos de **puntero**, no de toque: los mismos manejadores valen
  para dedo, ratón y lápiz, y `setPointerCapture` mantiene el seguimiento
  aunque el dedo se salga del tirador.

### 8.10 Una colección, varias vistas

Un listado de tarjetas ofrece `rejilla`, `compacta`, `lista` y `tabla`. Las
reglas:

- **Las opciones las decide la pantalla**, no el alternador: un listado sin
  tabla no ofrece «tabla».
- **`tabla` no pasa por `<CardGrid>`.** Esa vista no son tarjetas: la pantalla
  monta `<DataTable>`. Y si monta una tabla, **lleva su columna de acciones**;
  una fila que no se puede editar obliga a cambiar de vista para hacerlo.
- **Ni un breakpoint.** La rejilla usa `auto-fill` + `minmax`, así que mide el
  hueco en el que está y no la ventana. Con breakpoints se rompe en cuanto
  alguien la mete dentro de un panel o de un diálogo — que es exactamente lo
  que pasa al abrir el `<DrawerPush>` a su lado.
- El alternador **reutiliza `<SegmentedControl>`**. No es otro grupo de
  botones: hereda las flechas del teclado y el anuncio del grupo.
- **Las vistas cuentan lo mismo.** Si la tarjeta enseña una insignia de «Dado
  de baja», la tabla tiene que enseñarlo también. Cambiar de vista es cambiar
  de formato, nunca de información: una fila de baja que en tabla salía «Bien
  surtido» —porque le quedaban 80 kg— era cierta y engañosa a la vez.

### 8.11 La plantilla de un listado

Toda pantalla de lista se monta con `<ListLayout>` y siempre en este orden:

1. `<PageHeader>` — migas, marca del dominio (icono + fondo girado), título,
   descripción y, a la derecha, el interruptor de subvista y el botón de alta.
2. `<FilterBar>` — lo que acota (chips, fechas), lo que está acotando ahora
   (chips aplicados con su aspa y «Limpiar») y cómo se mira (`ViewSwitcher`).
3. La rejilla, su estado vacío y el hueco de crear.
4. El paginador, solo si hay más de una página.

**Lo que se acota vive en la URL**, sin excepción: pestaña, búsqueda, página,
vista y cada filtro. Una lista acotada tiene que poder compartirse por enlace.

La vista además **se recuerda por pantalla** (`useVistaPreferida`), pero eso es
el valor por omisión, no el valor: **si la URL dice `?vista=`, manda la URL**.
Un enlace recibido tiene que enseñar lo mismo a quien lo manda y a quien lo
abre.

Dos distinciones que no se pueden perder:

- «No hay nada» **no** es «tu filtro no encontró nada». Son dos vacíos con dos
  textos y dos acciones distintas.
- Un fallo de carga no se pinta como un vacío: manda a buscar el problema donde
  no está.

> **El hueco de crear solo aparece con la lista llena.** Con la lista vacía
> manda el estado vacío, que además explica por qué está vacía.

**En estrecho los filtros se pliegan, no se duplican.** Por debajo de `md` tres
grupos de chips se apilan en cinco líneas y se comen la pantalla antes de
enseñar un registro. Ahí `<FilterBar>` los cambia por un botón «Filtros» con
el número de los puestos, y al pulsarlo sube **la misma hoja de `<Drawer>`**
que ya usa el resto de la aplicación, con su tirador.

Lo que se monta dentro es el mismo `children`: no hay una segunda versión de
los filtros que mantener, ni un overlay nuevo. Y la hoja **solo se monta en
estrecho** —montarla siempre y esconderla con CSS deja un diálogo vivo
bloqueando el desplazamiento del documento y robando el foco; nos pasó con el
panel que empuja, está en §16.

### 8.12 Una cabecera y un menú, no copias

**No se escribe a mano una barra que ya existe.** Ni en un layout, ni «solo
para el catálogo», ni como «réplica estática para verla de cerca».

Pasó dos veces en este proyecto:

1. El layout del catálogo tenía su propia cabecera, cuadrada y sin la
   animación. Hoy las dos salen de `<HeaderShell>` y solo cambian sus hijos.
2. La sección de navegación del catálogo tenía una **copia estática** del menú
   inferior, con sus propias clases. Quedó desfasada en cuanto el menú real
   cambió. Se borró: el menú de verdad ya está en pantalla.

> Es el defecto exacto que medimos auditando: un componente de cabecera y media
> docena de cabeceras sueltas que se le parecían.

#### El buscador no lleva borde

Vive **dentro** de la cabecera, que ya tiene el suyo. Dos trazos concéntricos
a dos píxeles se leen como un error de maquetación, no como una caja. Se
distingue por el fondo —un velo del color del texto— y por el icono.

#### La forma del menú

| | Escritorio | Móvil |
|---|---|---|
| Posición | Píldora flotante, centrada abajo | Anclada al borde inferior |
| Ancho | El que necesite | De lado a lado |
| Radio | `full` | `rounded-t-xl`, abajo a escuadra contra el borde |
| Relleno del contenedor | **Ninguno** | **Ninguno** |

Sin relleno interno: los enlaces ocupan el alto entero. Con relleno asoma un
anillo del color del contenedor alrededor del enlace activo —el mismo defecto
que tuvo el segmentado— y la barra parece un botón mal encajado dentro de otro.

En el centro va **la acción que se repite**, no una entrada más: registrar una
venta se hace veinte veces por turno, entrar a la despensa dos.

### 8.13 Terminología de la interfaz

Un concepto, una palabra, en todo el producto. Aquí `borrado: true` se dice
**«dar de baja»**: ese es el verbo del botón, del diálogo de confirmación, de
la insignia de la tarjeta, de la columna de la tabla y de la opción del filtro,
en personal y en productos. Nunca «Desactivado» en una pantalla e «Inactivo»
en otra.

### 8.14 Nada de UI que no hace nada

Un botón que existe pero no está implementado **no se pinta**.

> **Motivo:** el menú de usuario del proyecto auditado tiene «Mi perfil»,
> «Preferencias» y «Sesiones activas», y las tres solo muestran un aviso que
> dice literalmente `Opción seleccionada: perfil`. Está en producción.

---

### 8.15 Un filtro de categorías admite varias

Los chips de un grupo son de **selección múltiple**. Varios valores del mismo
grupo se suman (cafés *o* masas); grupos distintos se cruzan (activos *y* de la
carta). La opción vacía —«Todas»— no es un valor: limpia el grupo.

**Lo que se elige viaja en la URL separado por comas** (`?categoria=a,b`), con
`shared/lib/params-lista.ts` como único sitio donde se decide esa forma.

Si la fila no cabe, se desplaza **con flechas que se puedan pulsar**, no solo
con un degradado: un degradado no es un control, y sin rueda horizontal deja
opciones inalcanzables. Las flechas aparecen solo cuando hay algo hacia ese
lado.

### 8.16 Lo que está en una pantalla de lista, está en las dos

Mismo recorrido guiado, mismo filtro de fecha, mismos estados, mismo
vocabulario. Si una pantalla tiene botón de ayuda, la otra también; si una
explica los filtros, la otra también.

No es simetría estética: dos pantallas hechas con la misma plantilla que se
explican distinto enseñan que funcionan distinto.

**Lo que sí puede tener una sola**: lo que solo tiene sentido en su dominio.
Personal tiene pestañas porque son dos colecciones; ventas tiene gráficos y
reporte porque es la única que tiene fechas y dinero que cuadrar. La prueba es
preguntarse si la otra pantalla lo usaría: un filtro de fecha sí —por eso está
en las cuatro, apagado donde el backend no da la fecha—; un «ingreso por día»,
no.

`audit-pantallas.mjs` lo comprueba y falla si una se sale del guion: que las
cuatro monten las **diez piezas comunes** —`ListLayout`, `PageHeader`,
`FilterBar`, `FiltroDeFecha`, `HelpButton`, `ViewSwitcher`, `Pagination`,
`ConfirmDialog`, `EmptyState` y `DrawerPush`—, que ningún paso de recorrido
señale un elemento que la vista no pinta, y que los recorridos cubran lo mismo
en el mismo orden.

## 9. Datos y estado

### 9.1 Tres tipos de estado, tres herramientas

| Tipo | Herramienta | Ejemplo |
|---|---|---|
| De servidor | **TanStack Query** | productos, usuarios |
| De URL | **`searchParams`** | filtros, paginación, orden, búsqueda |
| De formulario | **React Hook Form** | alta y edición |
| De UI local | **`useState`** | diálogo abierto, pestaña activa |
| De cliente compartido | Zustand — **cuando exista** | hoy: ninguno |

### 9.1.b Trabajar sin backend: puerto y dos implementaciones

Mientras un endpoint no exista, la feature declara un **puerto** —un tipo con
las operaciones— y tiene dos implementaciones: la real y una con datos falsos.
La elección es **una constante, no un `if` por método**:

```ts
export const usuarioApi: UsuarioApi = USAR_MOCKS ? usuarioApiMock : usuarioApiReal;
```

Reglas de los datos falsos:

- **Cumplen el contrato entero**: paginan, buscan, crean, aplican el PATCH y
  dan de baja. Si el mock no soporta una operación, la pantalla que la usa no
  está probada.
- **Tienen memoria** mientras viva la pestaña: sin eso no se puede comprobar
  que una edición se refleja en la lista.
- **Tardan.** 350 ms por llamada. Sin retardo los esqueletos no se ven nunca y
  se entrega una pantalla cuyo estado de carga nadie miró.
- **Los datos son los de verdad**, sacados del Excel de poblado. Nombres
  inventados esconden los desbordes que producen los reales.
- **Se borran con el flag.** `USAR_MOCKS`, los `*.mock.ts` y su `import` se van
  juntos el día que haya servidor. No se quedan «por si acaso».

**Una feature que nace con su servidor no tiene mock.** Es la consecuencia
directa de la regla de arriba: si el mock se borra el día que hay servidor,
una feature cuyo servidor ya existe no tiene nada que escribir para luego
borrar. `vencimientos` es la primera, y además **no podría** tenerlo: sus datos
son predicciones de un modelo, y un mock tendría que inventarse
probabilidades. Si `ml-api` no responde, la pantalla lo dice.

Mantiene el puerto (`vencimiento.puertos.ts`) con una sola implementación, y
su prueba de vista sustituye `fetch` en vez de un mock. `audit-pantallas.mjs`
la lista en `CON_SERVIDOR_DESDE_EL_INICIO`; entrar en esa lista se discute aquí,
no en el script.

### 9.1.c Un campo entra al esquema con el DTO delante

**Ningún campo se añade a un esquema de dominio sin haber leído el DTO del
backend que lo trae.** No «lo recuerdo», no «tiene sentido que exista», no «el
Excel lo tenía»: el fragmento del `*Response.java` o del `*Request.java`
delante, y el controlador en la lista de controladores.

Las tres cosas que hacen invisible un campo inventado:

1. **Los mocks lo tapan.** Los escribe quien inventó el campo, así que la
   pantalla funciona perfectamente hasta que se apaga `USAR_MOCKS`.
2. **Las pruebas lo confirman.** Una prueba demuestra que el código hace lo que
   dice; **no** que lo que dice sea cierto. Se puede tener cuatro pruebas
   verdes sobre un campo que no existe.
3. **El comentario da seguridad.** Citar un archivo por su nombre parece
   haberlo leído.

Lo mismo con los endpoints: **cada ruta que el frontend llama tiene que existir
en el backend.** `GET /tipo` no existía y no falló nunca, porque los datos
falsos respondían por él.

> Si el dato hace falta y el backend no lo tiene, hay dos salidas honestas:
> derivarlo de un campo que sí exista —«en la carta» sale de `vendible`— o
> enseñar el control **apagado con el motivo a la vista**, como el filtro de
> fecha. Inventarlo no es una de ellas.

### 9.2 Por qué no Redux

Los datos de la API no son estado de la aplicación: son **una caché de algo que
vive en otro servidor**. Necesitan revalidación, deduplicación, reintentos e
invalidación. Con Redux eso se escribe a mano.

> **Motivo, medido:** en el proyecto Angular auditado, **49 de 52 selectores
> eran `s => s.campo`** —passthroughs puros— y `store/` + `facade` suman **5.063
> líneas frente a 3.332 de todos los componentes** de esas pantallas. La capa de
> estado pesaba más que la interfaz y casi no transformaba nada.

### 9.3 Validar en el borde

**Toda respuesta de la API pasa por `schema.parse()`** antes de entrar en la
aplicación. Si el backend cambia, revienta ahí, con el nombre del campo, y no
tres capas más adentro con un `undefined`.

### 9.4 Claves de caché

Cada feature declara las suyas en `infrastructure/<x>.keys.ts`:

```ts
export const productoKeys = {
  all: ['producto'] as const,
  list: (p: ListaParams) => [...productoKeys.all, 'list', p] as const,
  detail: (id: string) => [...productoKeys.all, 'detail', id] as const,
};
```

Nunca un array de claves escrito a mano en un hook.

### 9.5 Después de escribir, se invalida

Toda mutación invalida lo que cambió en su `onSuccess`. **Nadie escribe
«recargar» a mano.**

> **Motivo:** el proyecto auditado usa un efecto de recarga con una lista de
> acciones a la que hay que acordarse de añadir cada acción nueva. Ya falló una
> vez: el filtro por fechas llegaba al reducer, el botón se pintaba activo y el
> listado no se movía.

### 9.6 Una política para los fallos de catálogo

Si un catálogo secundario falla, **no se afirma que está vacío**. Se deja en
estado de error y se dice. Emitir una lista vacía miente: afirma que no hay
categorías cuando lo que pasó es que no se pudieron pedir.

> **Motivo:** el proyecto auditado resuelve esto de dos formas opuestas en dos
> features, y en una de ellas el comentario explica por qué la otra está mal.

---

## 10. Formularios

### 10.1 React Hook Form + Zod, sin motor propio

No se construye un motor de formularios. El esquema Zod que valida la respuesta
es **el mismo** que valida el formulario.

> **Motivo:** el proyecto Angular auditado escribió uno —`DynamicFormBuilder`,
> `ValidatorService`, `form.interface.ts`— porque Angular no tiene ese
> ecosistema. React sí. Reconstruirlo serían 400 líneas para replicar una
> librería madura.

### 10.2 Composición libre, sin rejilla impuesta

El formulario se arma con `<FormRow>` y `<FormField span="...">`. Cada campo
declara cuánto ocupa; las filas se reordenan solas al estrecharse. No hay una
rejilla de 12 columnas fija ni un `grid-cols-2` repartido por las pantallas.

### 10.3 Formularios largos van por pasos

Por encima de **seis campos** o de **dos asuntos distintos**, el formulario se
reparte en pasos con `<FormWizard>`.

| Quién decide | Qué |
|---|---|
| Quien lo usa | El `useForm`: esquema, valores iniciales y envío |
| El asistente | En qué paso estamos, si se puede avanzar y cómo se pinta la revisión |

Tres reglas que el componente garantiza y que hay una prueba por cada una:

1. **No se avanza sin validar.** `trigger()` corre **solo sobre los campos de
   ese paso**. Validar el formulario entero marcaría en rojo campos de pasos
   que nadie ha visto todavía.
2. **El último paso es la revisión**, y es el **único** sitio desde el que se
   envía. Nadie manda un alta sin haber leído lo que manda.
3. **Volver atrás conserva lo escrito.** Cada paso se monta con su propia
   `key`; sin ella React reutiliza el mismo `<input>` del DOM entre pasos y el
   campo aparece con el valor del paso anterior. Ver §16.10.

Alta y edición son **el mismo formulario**: si llegan valores, arranca con
ellos y el botón final cambia de texto. Dos formularios casi iguales acaban
divergiendo en el campo que alguien añadió solo en uno.

### 10.4 Un carnet no es un número

Los identificadores —carnet, teléfono, NIT— son **cadenas de dígitos**, no
cantidades: no se suman, no se ordenan y pueden empezar por cero. Van con
`<Input soloDigitos>`, nunca con `type="number"`.

| `type="number"` | `soloDigitos` |
|---|---|
| Acepta `e`, `+`, `-` — son números válidos | Solo `0-9` |
| Trae ruedecilla que cambia el valor sin querer | No |
| En varios navegadores deja el campo vacío sin decir por qué | Lo visible es lo que recibe el formulario |
| El móvil abre el teclado numérico | También (`inputMode="numeric"`) |

El filtrado ocurre en el `onChange`, **antes** de avisar al formulario: así lo
que se ve y lo que se valida son lo mismo. Filtrar en `onKeyDown` dejaría
pasar el pegado y el dictado por voz.

### 10.5 Etiqueta flotante, siempre

**Ninguna etiqueta va suelta encima del campo.** `<Field>` la pinta dentro,
centrada, y la sube a la franja de arriba —**sin salir del control**— en cuanto
hay foco o contenido.

- La lógica es **CSS** (`.campo-flotante` en `globals.css`), apoyada en
  `:has()`. El control no colabora: un `<input>`, un `<textarea>` o un
  `<select>` dentro del campo funcionan sin saber que la etiqueta existe.
- **Todo control de texto lleva `placeholder`**, aunque sea un espacio. Sin el
  atributo, `:placeholder-shown` no casa nunca y la etiqueta se quedaría
  flotando sobre un campo vacío. El componente lo pone solo.
- El marcador de verdad **no se ve hasta que se enfoca** el campo: mientras
  descansa la etiqueta, los dos textos se pisarían.
- La etiqueta de un `<select>` está **siempre arriba**: un desplegable nunca
  está vacío.
- Con icono a la izquierda, la etiqueta **conserva su margen** también flotada:
  el icono está centrado y su caja llega hasta la franja de arriba.
- El campo pequeño mide **36 px**, no 32, porque la etiqueta ocupa una franja
  dentro. Es el precio y se paga.

> **Lo que NO se hace:** montar la etiqueta sobre el borde con un trocito de
> fondo que corte la línea. Funciona solo si ese fondo coincide con lo que hay
> detrás, y detrás hay tarjetas, diálogos y paneles de colores distintos: sobre
> una tarjeta se veía **un rectángulo negro pegado al borde**. Un truco que
> depende de adivinar el fondo del vecino no es un truco, es una avería a
> plazos.

> **Motivo:** la etiqueta encima gasta una línea por campo y desalinea las
> filas cuando unos campos llevan ayuda y otros no. Flotando, el campo ocupa
> su alto y nada más — y la etiqueta sigue ahí cuando el campo está lleno, que
> es lo que un `placeholder` a secas no hace.

### 10.6 El mensaje va en el esquema

```ts
nombre: z.string().min(2, 'El nombre necesita al menos 2 caracteres')
```

Nunca la regla en un sitio y el número del mensaje en otro.

### 10.7 El error se muestra cuando toca

Tras tocar el campo o tras intentar enviar. No mientras se escribe por primera
vez.

### 10.8 El diálogo no se cierra si el guardado falla

Si el servidor rechaza, el diálogo **sigue abierto con lo escrito**. Cerrarlo
pierde el trabajo de la persona.

---

## 11. Accesibilidad

No es una fase final. Es parte de «está hecho».

1. **`lang="es"` en `<html>`.** La aplicación está en español.
   > El proyecto auditado tiene `lang="en"`.
2. **Cada ruta pone su `<title>`** mediante `metadata`.
   > El proyecto auditado tiene `EstracondWebV2` en sus diez pantallas.
3. **Todo control alcanzable con teclado.** Si algo se abre con el ratón, se
   abre con `Enter`, se cierra con `Escape` y devuelve el foco.
   > En la librería auditada, el ojo de mostrar contraseña lleva `tabIndex={-1}`
   > y el tooltip solo escucha eventos de ratón.
4. **`:focus-visible` en todo lo enfocable.** Sin anillo, no se entrega.
5. **Un icono solo nunca va sin nombre accesible** (`aria-label`).
6. **Contraste AA** como mínimo: 4.5:1 en texto normal, 3:1 en texto grande.
7. **`prefers-reduced-motion`** respetado: quien lo pida no ve animaciones.
8. **Nada de `<div onClick>`.** Si es pulsable, es `<button>` o `<a>`.

---

## 12. Rendimiento

1. **Server Components por defecto.** `'use client'` solo en la hoja que
   necesita interacción, nunca en una página entera.
   > En la librería auditada, **las 89 páginas son `'use client'`**: es una SPA
   > de React dentro de Next.
2. **Nada de datos de prueba en el bundle.** Los dobles viven en su carpeta y
   no se importan desde código de producción.
   > En el proyecto auditado, `admin1234` y `1234567` están dentro de
   > `main.js` del build de producción.
3. **`next/dynamic` solo para tres cosas:** gráficos, editor enriquecido y
   mapas. El resto lo divide el enrutador solo.
4. **`next/image` siempre.** Nunca un `<img>` suelto.
5. **Cero dependencias duplicadas.** Una librería de animación, una de iconos,
   una de fechas.
   > La librería auditada tiene `framer-motion` **y** `motion`, más
   > `react-router-dom` y `vite` en un proyecto Next.

---

## 13. Prohibiciones

Lista corta y sin matices. Nada de esto entra.

### 13.1 En configuración
- `typescript.ignoreBuildErrors` y `eslint.ignoreDuringBuilds`.
- `tailwind.config.ts` (v4 se configura en CSS).
- Un segundo archivo CSS.

### 13.2 En tipos
- `any`.
- `as unknown as`.
- `@ts-ignore` (`@ts-expect-error` con motivo escrito, y solo en un test).
- Un tipo escrito a mano que duplique un `z.infer`.

### 13.3 En estructura
- `core/`, `helpers/`, `utils/`, `common/`, `misc/`.
- Un archivo con varios hooks no relacionados.
- Importar de otra feature.
- Importar el propio `index.ts` desde dentro de la feature.

### 13.4 En UI
- Colores literales (`#fff`, `bg-red-500`).
- `rounded-none` y `rounded-lg`.
- Tamaños `lg` o mayores, y `md` donde `sm` basta.
- Spinners.
- Clases CSS globales que repliquen un componente.
- `<div onClick>`.
- Etiquetas de campo colgadas encima del control.
- Un diálogo que cierre al pulsar fuera.
- Texto en la interfaz escrito en inglés.

### 13.5 En restos
- Un archivo que no importa nadie.
- Un `export` que no menciona ningún otro archivo.
- Un tipo o un esquema que solo alimenta a su propia reexportación.
- Un ayudante «por si acaso». Si no hay consumidor hoy, no se escribe hoy.

Lo comprueba `scripts/audit-muertos.mjs` y rompe el build. La primera vez que
se ejecutó encontró **36 restos** en este mismo proyecto, escritos por quien
redactó esta regla: cuatro formateadores de fecha, tres validadores, un tipo de
paginación que duplicaba su propio esquema y ocho tipos que solo salían por el
barril.

### 13.6 En datos
- `fetch` fuera de `shared/api/http-client.ts`.
- `localStorage` para tokens.
- Mandar el registro entero en una actualización.
- Un array de claves de caché escrito a mano.

### 13.7 En lenguaje
- Texto genérico de relleno: «Lorem ipsum», «Item 1», «Click here».
- «Gestiona tus productos de forma eficiente». Nadie habla así.
- Exclamaciones en mensajes de sistema. «Guardado», no «¡Guardado con éxito!».

Los textos se escriben como los diría una persona que trabaja en la cafetería.
«Quedan 2.5 kg de 10» dice más que «Nivel de stock: 25 %».

---

## 14. Procedimiento de entrega

No es una sugerencia. Es el orden en que se hace el trabajo, y saltarse un paso
es lo que ha producido **todos** los fallos de la sección 16.

### 14.1 Los seis pasos

| # | Paso | Cómo se comprueba |
|---|---|---|
| 1 | **Leer antes de escribir** | Abrir los archivos que se van a tocar y los que los consumen. No editar a ciegas |
| 2 | **Hacer el cambio** | Mínimo, en su capa, con su motivo en un comentario |
| 3 | **Pasar las cuatro máquinas** | `npm run check` en verde: tipos, lint, tokens, muertos |
| 4 | **Mirarlo en pantalla** | Lo que decide si algo está bien es cómo se ve, no si compila |
| 5 | **Medir lo que se afirma** | Si digo «es un círculo», mido ancho y alto. Si digo «no se cierra», lo pulso |
| 6 | **Contar lo revisado** | La tabla de §14.4, con números reales |

### 14.2 Las cinco máquinas

```bash
npm run check   # typecheck → lint → audit-tokens → audit-muertos → vitest
npm run build   # y esto antes de decir que algo está terminado
```

| Comprueba | No comprueba |
|---|---|
| Tipos sin excepciones | Que el componente sirva para algo |
| Capas, ciclos, `any`, variables sin usar | Que el nombre diga la verdad |
| Tokens declarados, radios y tamaños prohibidos | Que dos radios válidos no se mezclen en la misma pantalla |
| Archivos y exportaciones sin consumidor | Que un archivo con consumidor merezca existir |
| El comportamiento que las pruebas cubren | El comportamiento que nadie escribió |

**La columna derecha es la que importa.** Casi todo lo que se ha roto en este
proyecto pasaba las máquinas de la izquierda.

Cada promesa y su prueba están listadas en **`SPECS.md`**, incluida la
sección de lo que **no** está cubierto. Esa sección nunca está vacía: si lo
estuviera, sería que no se miró.

#### Qué se prueba y qué no

Se escribe una prueba cuando el código **afirma un comportamiento**:

| Se prueba | Ejemplo aquí |
|---|---|
| Reglas de negocio | El umbral de `nivelDeStock` |
| Traducciones con trampa | `toPatch`: `undefined` no viaja, `null` sí |
| Promesas de interfaz | El diálogo NO cierra al pulsar fuera |
| Accesibilidad afirmada | El segmentado cambia con las flechas |

**No** se prueba que un `div` tenga una clase: eso lo dice el código y cambiará
con el diseño. Si una prueba solo repite el JSX, sobra.

> Una prueba verde tampoco justifica que el código exista: `audit-muertos`
> marca como resto lo que **solo** usa su propia prueba.

### 14.3 Checklist

Se responde de verdad, con la evidencia al lado. Decir que algo funciona sin
haberlo comprobado es la peor forma de entregar.

**Estructura**
- [ ] Cada archivo nuevo está en su capa y no importa hacia arriba.
- [ ] Lo que se afirma que funciona tiene una prueba que lo ejecuta.
- [ ] Ninguna feature importa de otra.
- [ ] El barril no se importa desde dentro de su propia feature.
- [ ] Desde fuera de `shared/ui` solo se importa el barril.
- [ ] No hay archivos huérfanos ni exportaciones sin consumidor.
- [ ] Ningún `.tsx` declara datos de módulo.

**Tipos y calidad**
- [ ] `npm run typecheck` termina en 0 errores.
- [ ] `npm run lint` termina limpio.
- [ ] Cero `any` y cero `as unknown as`.

**Diseño**
- [ ] `node scripts/audit-tokens.mjs` pasa: todo token usado está declarado.
- [ ] Cero colores literales.
- [ ] Cero `rounded-lg`, cero `rounded-none`, cero tamaños `lg`.
- [ ] Superficies en `xl`, controles en `md`. No mezcladas.
- [ ] Cero spinners.
- [ ] Ningún componente duplica a otro que ya existe.

**Comportamiento**
- [ ] Probado a 375 px, 768 px y 1280 px.
- [ ] Recorrido entero con el teclado.
- [ ] Los estados de carga, vacío y error se ven de verdad, no solo el feliz.
- [ ] Los dos temas, mirados.

**Honestidad**
- [ ] Lo que digo que funciona, lo he ejecutado.
- [ ] Lo que afirmo con un número, lo he medido.
- [ ] Lo que no probé, lo digo.

### 14.4 La tabla de cierre

**Toda entrega termina con esta tabla.** No es decorativa: es el contrato de que
la revisión ocurrió. Un número inventado aquí es peor que no entregar.

| Concepto | Valor | Cómo se obtuvo |
|---|---|---|
| Archivos del proyecto | *n* | `audit-muertos` lo imprime |
| Archivos tocados en esta entrega | *n* | Lista real de archivos editados |
| Archivos leídos enteros | *n* | Los que abrí, no los que rocé |
| `typecheck` | 0 errores | Salida del comando |
| `lint` | 0 problemas | Salida del comando |
| Tokens | *n* declarados / *n* revisados | Salida del script |
| Código muerto | 0 · *n* exportaciones | Salida del script |
| Pruebas | *n* pasan / *n* archivos | `vitest run` |
| `build` | ✓ · *n* rutas | Salida del comando |
| Comprobaciones en pantalla | *n* | Qué se miró, una por línea |
| Mediciones | *n* | Qué se midió y qué dio |
| Defectos propios encontrados | *n* | Enumerados, con su arreglo |
| **No verificado** | *lista* | Lo que quedó fuera y por qué |

#### Reglas de la tabla

1. **Un número solo se escribe si sale de un comando o de una lista real.**
   Nada de estimaciones redondeadas.
2. **«Revisado» significa leído entero**, no «aparece en un `grep`». Si
   solo lo rocé, va en «tocados», no en «leídos».
3. **La última fila nunca está vacía.** Siempre hay algo sin verificar; decir
   lo contrario es el falso positivo más caro de todos.
4. **Un defecto propio encontrado vale más que un check verde.** Una entrega
   con la lista de defectos vacía y sin nada en «no verificado» es una entrega
   que no se revisó.

---

## 15. Cómo crece el proyecto

Escrito de antemano para que crecer no sea improvisar.

| Síntoma | Qué se añade |
|---|---|
| Tres features necesitan el mismo modelo de dominio | Capa `src/entities/` entre `features` y `shared` |
| Una pantalla compone piezas de varias features | Capa `src/widgets/` |
| Estado de cliente que cruza componentes | Zustand, **una store por dominio** |
| Un `*.schema.ts` pasa de 150 líneas | Se parte en `schema` + `mapper` |
| El Demo UI se queda corto | Storybook |
| Aparece un segundo idioma | i18n |

La regla que gobierna todas: **a la tercera repetición, no a la segunda**. Una
abstracción equivocada cuesta más que dos duplicaciones.

### 15.1 Dominios que ya tienen nombre esperándolos

El backend define cuatro contextos. Cuando toque, las carpetas ya se llaman así:

| Contexto del backend | Feature futura |
|---|---|
| `Inventario` | `productos` ✅, `categorias`, `unidades`, `recetas` ✅, `lotes`, `vencimientos` ✅ (servicio `ml-api`) |
| `Personal` | `usuarios` ✅, `clientes`, `proveedores` |
| `Ventas` | `ventas`, `descuentos` |
| `Pedidos` | `pedidos` |

---

*Este documento se actualiza cuando cambia una decisión, en el mismo cambio que
la introduce. Un documento que describe un proyecto que ya no existe es peor que
no tener documento.*

---

## 16. Autocrítica: lo que ya salió mal aquí

Todas las reglas de este documento nacieron de un fallo. Las de arriba, de
fallos ajenos que auditamos. Las de esta sección, **de fallos propios**, en
este mismo repositorio, escritos por quien redactó las reglas que rompían.

Están aquí porque una regla sin su cadáver al lado se olvida. Y porque el
patrón se repite: casi ninguno lo cazó una máquina.

### 16.1 Afirmar sin medir

| Qué dije | Qué pasaba |
|---|---|
| «El botón expandible ya es un círculo» | Medía **42×32** |
| Lo arreglé y volví a decirlo | Medía **34×32**: faltaba descontar el borde |
| «La regla de capas se aplica en CI» | No saltaba: faltaba `mode: 'file'` |

**La regla:** si la afirmación tiene una forma, un tamaño o un comportamiento,
se mide o se ejecuta antes de escribirla. `getBoundingClientRect()` para lo
que se ve; una violación deliberada para lo que promete bloquear.

La tercera es la peor de las tres: dije que el CI impedía algo sin haber
probado nunca a saltármelo. Una comprobación que nadie ha visto fallar no
existe.

### 16.2 Resolver con un truco que depende del vecino

La etiqueta flotante se montaba sobre el borde con un trocito de fondo que
cortaba la línea. Funciona **solo** si ese fondo coincide con lo que hay
detrás, y detrás hay tarjetas, diálogos y paneles de colores distintos: sobre
una tarjeta se veía un rectángulo negro pegado al borde.

**La regla:** un componente no puede depender de adivinar el fondo de quien lo
contiene. Si la solución necesita saber dónde está, la solución está mal.

### 16.3 Copiar en vez de reutilizar

Dos veces, en el mismo sitio, después de escribir la regla que lo prohíbe:

1. El layout del catálogo tenía **su propia cabecera**, cuadrada y sin la
   animación de la de verdad.
2. La sección de navegación tenía una **réplica estática** del menú inferior,
   con sus propias clases, desfasada en cuanto el menú real cambió.

Y una tercera, de vocabulario: la escala `critico / bajo / suficiente` estaba
escrita **tres veces** —tono en la tarjeta, texto en el dominio, y las dos
copiadas en los datos del catálogo—.

**La regla:** antes de escribir una barra, una cabecera o una tabla de
valores, se busca si ya existe. «Es solo para el catálogo» y «es solo una
réplica para verlo de cerca» son las dos frases que preceden a una copia.

### 16.4 Poner el valor por omisión donde no toca

La escala de tamaños llegaba hasta `md` y estaba bien. Lo que estaba mal era
que `md` fuese **el valor por omisión**: una pantalla entera salía grande sin
que nadie lo hubiera pedido.

**La regla:** el valor por omisión es la decisión que más veces se aplica.
Se elige con más cuidado que las otras, no con menos.

### 16.5 Mezclar dos cosas en un archivo

- Secciones del catálogo con **80 líneas de datos** antes del primer
  componente.
- `entity-card.tsx` con la tarjeta de registro, el hueco de crear y la
  rejilla: tres cosas que solo comparten el sitio donde se pintan.
- Tablas de consulta (`ACENTOS`, `TRAMOS`, `CLASES_CALENDARIO`) dentro del
  `.tsx` que las usa.

**La regla:** §4.3 y §4.4. Un `.tsx` declara componentes; los datos van a su
`.data.ts`; y un archivo, una cosa —aunque las dos cosas se pinten juntas—.

### 16.6 Escribir de más «por si acaso»

La primera pasada del auditor de código muerto encontró **36 restos**, 34 de
ellos míos: cuatro formateadores de fecha con su comentario explicando el
fallo que evitaban y ni una sola llamada, tres validadores, un tipo de
paginación que duplicaba su propio esquema, y ocho tipos que solo salían por
el barril.

**La regla:** §13.5. Si no hay consumidor hoy, no se escribe hoy. Lo escrito
«por si acaso» no se usa y sí se mantiene.

### 16.7 Arreglar una cosa y romper la de al lado

- Declarar `--spacing-md` para ordenar el espaciado **sombreó `max-w-md`**, y
  un párrafo de la portada se partió en una palabra por línea.
- Subir el radio de las tarjetas a `xl` dejó los paneles que las contienen en
  `md`: dos radios para el mismo tipo de superficie, los dos válidos por
  separado, en la misma pantalla.
- Mover la etiqueta flotante al margen izquierdo la puso **encima del icono**
  del campo.

Ninguno lo cazó un script. Los tres se vieron mirando la pantalla.

**La regla:** §14.1, paso 4. Después de tocar algo transversal —un token, un
radio, una posición— se mira lo que hay alrededor, no solo lo que se tocó.

### 16.8 Dar por bueno lo que no se ha ejecutado

El menú tenía una entrada al catálogo, y el catálogo responde **404 en
producción**. Es decir: un enlace roto en la barra principal de todo el mundo,
en la única configuración que importa. Estaba así desde el primer día porque
solo se había mirado en desarrollo.

**La regla:** lo que cambia de comportamiento entre desarrollo y producción se
comprueba **en la build de producción**, no en `next dev`.

### 16.9 Creer que mirar la pantalla basta

El asistente por pasos funcionaba **mirándolo**: se rellenaba, se avanzaba, se
enviaba. La prueba «se puede volver a un paso ya completado» falló a la
primera: al volver atrás, el campo «Nombre» aparecía con lo tecleado en
«Precio».

La causa: dos pasos distintos caían en la misma posición del árbol de React,
así que React reutilizaba **el mismo `<input>` del DOM** y su valor viejo se
quedaba. Solo se ve si vuelves atrás después de haber escrito en el paso
siguiente — exactamente el camino que no se prueba a mano.

**La regla:** mirar la pantalla cubre el camino feliz. Lo que hay que escribir
como prueba es el camino que uno no repetiría veinte veces a mano: volver
atrás, dejar un campo vacío, pulsar donde no toca.

Es el único defecto de esta lista que **no** encontré yo: lo encontró una
prueba, la primera vez que la ejecuté.

### 16.10 Confiar en que «no hay botón» equivale a «no se puede»

El asistente solo pintaba el botón de envío en el paso de revisión, y di por
hecho que con eso bastaba. No basta: **un formulario sin botón de envío se
envía igual al pulsar Enter en un campo** —la submit implícita del navegador—.
Al editar un registro, donde todos los valores ya son válidos, eso guardaba
desde el paso 1 y se saltaba la revisión entera.

Y al lado, tres defectos de la misma familia en el catálogo: el diálogo se
cerraba antes de guardar, el aviso de éxito salía antes de tener éxito, y los
puntos del botón no aparecían nunca porque no había estado de guardado que los
encendiera.

**La regla:** una restricción se implementa donde se decide, no donde se
dibuja. Si el envío solo vale desde la revisión, es el `onSubmit` quien lo
rechaza; que el botón no esté pintado es una consecuencia, no la defensa. Y el
orden al guardar es siempre **guardar → confirmar → cerrar**, nunca al revés.

Lo reportó el usuario probándolo. Yo lo había recorrido entero con el ratón y
no lo vi: nunca pulsé Enter.

### 16.11 Diseñar un filtro para un dato que la API no devuelve

La pantalla de Usuarios pedía un filtro por intervalo de fechas. Lo monté
antes de comprobar el contrato: `PersonaResponse` **no devuelve `fec_c` ni
`fec_u`**, aunque la tabla los tenga. No hay fecha por la que filtrar.

Estuve a punto de resolverlo inventándome la fecha en los datos falsos. Habría
funcionado en la demo y habría fallado el día de la conexión real: el peor
tipo de error, el que se descubre tarde y con público.

Lo que hay ahora: el control **montado y apagado**, con el motivo escrito al
lado y en su `title`. Se enciende el día que la API devuelva la fecha.

Del mismo tirón, una limitación que hay que decir y no disimular:
`ObtenerUsuariosRequest` solo acepta `skip`, `limit` y `search`, así que los
filtros por rol y por estado **se aplican sobre la página ya cargada**, no en
el servidor. Está comentado en la vista, en el sitio donde alguien lo buscaría.

**La regla:** antes de dibujar un filtro, un orden o una columna, se comprueba
que el dato existe en la respuesta. Un control que no puede funcionar es peor
que uno que falta, porque el que falta se pide y el otro se cree.

### 16.12 El botón que muda de tipo bajo el dedo

Dije que el asistente ya no se enviaba solo, y seguía haciéndolo: al pulsar
«Siguiente» por tercera vez, el diálogo llegaba a la revisión **y guardaba en
el mismo clic**, sin que nadie confirmara nada.

La causa no era la que arreglé la vez anterior. «Siguiente» y «Guardar»
ocupaban la misma posición del árbol, así que React reutilizaba **el mismo
nodo `<button>`** y solo le cambiaba el `type`. El navegador evalúa la
*activation behavior* de un botón **después** de correr los manejadores: para
cuando le tocaba, el botón ya era `submit`, y el clic que llevaba a la
revisión enviaba el formulario de paso.

Tres cosas que aprender de aquí:

1. **Arreglé el síntoma que sabía explicar.** Encontré la submit implícita del
   Enter, era real, la arreglé, y di el caso por cerrado sin volver a pulsar
   el botón. Un arreglo correcto no demuestra que la causa fuera esa.
2. **La prueba pasaba y el navegador fallaba.** jsdom no reproduce la
   activación de un botón como un navegador de verdad. Una prueba en verde
   **no** es una comprobación en pantalla, y aquí lo escribí como si lo fuera.
3. **La defensa ahora es estructural, no de comportamiento.** El formulario
   hace `preventDefault` siempre, guardar es una llamada explícita, y hay una
   prueba que cuenta cuántos `button[type=submit]` hay dentro: cero. Eso sí lo
   puede comprobar jsdom.

**La regla:** cuando un defecto reaparece, la causa no era la que se arregló.
Y si dos botones se turnan en el mismo sitio, se les da `key` distinta: son
dos cosas, no una que cambia.

### 16.13 Un literal repetido cinco veces es una regla sin sitio

`tipo.nombre === 'Insumo'` estaba escrito **cinco veces**, todas en
`presentation`: en la tarjeta, en la tabla, dos veces en el formulario y dos en
la vista. Decidía el icono, el color de la etiqueta y qué productos pueden ser
padre de otro — o sea, una regla de negocio, repartida entre componentes que
solo tendrían que pintar.

Ninguna herramienta lo vio: no es código muerto, no es un ciclo, no salta el
lint. Se encontró buscando literales a mano, porque la pregunta era «¿hay algo
hardcodeado?» y la respuesta honesta exigía mirar.

Ahora es `esInsumo(tipo)` en el dominio, con sus cuatro pruebas y su deuda
escrita: `TipoResponse` no trae código ni bandera, así que lo único comparable
es el nombre. Y no se compara con el `id`, que sería peor: los UUID son de cada
base y no sobreviven a un cambio de entorno.

> **Regla:** antes de entregar, busca los literales del dominio en
> `presentation`. Si uno aparece dos veces, es una función del dominio que
> todavía no existe.

### 16.14 Una lista que dice proteger seis rutas y protege tres

`proxy.ts` declaraba `RUTAS_PROTEGIDAS` con seis entradas y un `matcher` con
tres. Para `/inventario`, `/recetas`, `/ventas` y `/caja` el guardia **nunca
llegaba a ejecutarse**.

No se colaba nadie —el layout del panel es un Server Component que lee la
cookie y redirige igual—, y por eso el `curl` daba 307 en las seis y parecía
correcto. La prueba de que no lo era estaba en el detalle: sin el `matcher`, la
redirección no llevaba `?volverA=`, porque la hacía el layout y no el guardia.
Comprobar el código de estado habría confirmado un comportamiento correcto por
un motivo equivocado.

> **Regla:** cuando dos sitios tienen que decir lo mismo, la prueba no es que
> el resultado salga bien; es que salga bien **por el camino que se declaró**.

### 16.15 Dos vistas de la misma colección contando cosas distintas

La tarjeta de un producto dado de baja llevaba su insignia. La fila de la tabla
enseñaba «Bien surtido», porque le quedaban 80 kg. Las dos eran ciertas y la
segunda engañaba: ese producto ya no se repone ni se vende. Con el filtro en
«Dados de baja», la tabla era una columna de verdes.

> **Regla:** cambiar de vista cambia el formato, nunca la información.

### 16.16 El arnés que hace fallar la prueba y parece un fallo del producto

La primera prueba de `ProductoView` fallaba al pasar a tabla. El producto
estaba bien: mi `useSearchParams` falso guardaba la consulta en una variable y
`router.replace` solo la anotaba en un espía, así que la vista escribía
`?vista=tabla` y nada la repintaba nunca.

Estuve a punto de «arreglar» la vista montando la prueba ya con la URL puesta,
que habría pasado en verde sin comprobar el flujo. Lo correcto era arreglar el
arnés: ahora `replace` cambia la consulta **y avisa**, y la prueba recorre el
ciclo entero.

> **Regla:** cuando una prueba falla, decide primero si miente el producto o el
> arnés. Un arnés que miente se nota porque el arreglo más cómodo consiste en
> comprobar menos.

### 16.17 Me inventé un campo del backend y lo documenté como leído

El peor de toda la entrega. El producto tenía **«tipo»** —Producto o Insumo—
con su esquema, su filtro, su columna, su paso del formulario, su icono, su
catálogo pedido a `GET /tipo` y su regla `esInsumo()` con cuatro pruebas en
verde.

**Nada de eso existe.** No hay `id_tipo` en la tabla `producto`, no hay `tipo`
en `ProductoResponse`, no hay `idTipo` en `CrearProductoRequest` y no hay
`TipoControllerV1` —los únicos «tipo» del backend son `tipo_movimiento` y
`tipo_descuento`, de otros contextos—. Y el archivo del esquema decía, en su
cabecera: «Tomado de `ProductoResponse.java` del backend, campo a campo, no de
una documentación».

Lo que lo hizo invisible durante toda una entrega:

- **`USAR_MOCKS` lo tapaba.** Los datos falsos los escribí yo, con el campo
  inventado dentro, así que la pantalla funcionaba perfectamente. El 404 de
  `/tipo` habría aparecido el día de conectar el backend.
- **Las pruebas lo confirmaban.** `esInsumo` tenía cuatro, todas verdes. Una
  prueba demuestra que el código hace lo que dice; **no** que lo que dice sea
  cierto.
- **El comentario mentía con seguridad.** Citar un archivo por su nombre da la
  apariencia de haberlo leído.

> **Regla:** un campo nuevo entra al esquema **con el fragmento del DTO
> delante**. Y antes de entregar, cada endpoint que el frontend llama tiene
> que existir en la lista de controladores del backend. Si no se puede
> comprobar, el campo no se añade: se pregunta.

### 16.18 Un filtro de selección única no es un filtro

Las categorías se elegían de una en una. «Enséñame cafés y capuchinos» eran dos
búsquedas seguidas, y ninguna daba la respuesta. Eso no es filtrar: es navegar.

Lo mismo con las flechas: la fila de chips se desplazaba, pero la única señal
era un degradado. Un degradado no se puede pulsar, y en un escritorio sin
pantalla táctil ni rueda horizontal había opciones **inalcanzables**.

> **Regla:** un filtro de categorías admite varias. Y si algo se desplaza, se
> desplaza con un control que se pueda pulsar, no solo con una pista visual.

### 16.19 Dos pantallas iguales, y solo una con ayuda

Productos tenía recorrido guiado y Usuarios no, durante una entrega entera.
Misma plantilla, mismos patrones, misma barra, mismo panel — y una con botón de
ayuda y otra sin. La asimetría no se ve escribiendo una pantalla: se ve
poniéndolas al lado.

Peor: al estandarizarlo, dos de los cinco pasos del recorrido nuevo señalaban
anclas que la vista no pintaba. No lo ve el compilador —el selector es una
cadena—, no lo ve el lint y no lo ve `audit-muertos`. Ahora lo ve
`audit-tours.mjs`, y se comprobó renombrando un ancla a propósito para verlo
fallar.

> **Regla:** lo que se hace en una pantalla de lista, se hace en las dos. Y lo
> que se enlaza por una cadena de texto necesita quien lo audite.

### 16.20 Ejecuté una herramienta que el proyecto no usa

Lancé `prettier --write` sobre una vista para recolocar unas líneas. El
proyecto **no tiene Prettier configurado**, así que aplicó sus valores por
omisión y reescribió el archivo entero a comillas dobles.

El daño visible fue cosmético. El interesante fue otro: `audit-muertos` buscaba
`from '…'` solo con comillas simples, así que dio **catorce archivos huérfanos**
de golpe —toda la feature de personal— por un cambio de comillas. Falsos, y
ruidosos justo cuando estaba comprobando de verdad.

> **Regla:** no se ejecuta sobre el código una herramienta que el proyecto no
> tiene configurada. Y una auditoría que depende del estilo del código está
> midiendo el estilo, no el código.

### 16.21 Una feature que necesita a otra no la importa: declara lo que consume

Recetas necesita productos —para elegirlos, para resolver nombres y para saber
si alcanza el stock—. Las tres salidas eran importar `features/productos`
(prohibido), subir `productoSchema` a `shared` (metería dominio en una capa que
no lo tiene) o **declarar aquí el contrato mínimo**: cuatro campos de sólo
lectura, `ReferenciaDeProducto`, parseados del mismo endpoint.

Parece duplicación y no lo es: `Producto` es un agregado con reglas que aquí no
pintan nada. Lo que se comparte es el *endpoint*, no el modelo — y así el día
que productos cambie un umbral, recetas no se entera.

> **Regla:** cuando dos features se necesitan, la que consume declara el
> contrato mínimo que usa. Si acaban compartiendo el modelo entero y la
> pantalla, entonces eran una sola feature (regla 4.4).

### 16.22 `toPatch` mandaba las listas enteras en cada guardado

Con formularios planos, comparar los elementos de un array por referencia
bastaba. Las recetas trajeron **listas de objetos**, que el formulario
reconstruye en cada render: dos listas idénticas salían siempre como distintas,
y el PATCH mandaba ingredientes y pasos completos aunque no se tocara nada.

No se vio escribiendo el código: se vio porque la prueba «sin cambios no manda
nada» —copiada de las otras dos features sin pensar— se puso roja.

> **Regla:** la promesa de «solo lo que cambió» hay que volver a probarla cada
> vez que cambia la **forma** de lo que se guarda, no solo el dominio.

### 16.23 El backend dice PUT y la regla dice PATCH

`RecetaControllerV1` declara `@PutMapping`, y **los seis controladores
también**. La instrucción del proyecto es explícita: nada de PUT. Hoy los
adaptadores mandan PATCH, así que contra el servidor real toda edición daría
405 — en recetas, en productos y en personal.

Lo que **no** hice: añadir un `put` al cliente HTTP por mi cuenta, ni tapar el
conflicto con el mock. Elegir verbo de la API no es una decisión de frontend, y
callarlo habría sido exactamente el error del «tipo» de producto otra vez.

> **Regla:** cuando el contrato y la instrucción se contradicen, no se elige en
> silencio. Se implementa lo que dice la instrucción, se anota el conflicto
> donde se ve y se pregunta.

### 16.24 La regla §2.9 me pilló a mí, en el navegador

El chip de «Filtrando por» de ventas decía **«20 sept 2026»** para un
`?desde=2026-09-21`. La causa es la que esta misma guía lleva describiendo
desde el principio: `new Date('2026-09-21')` se interpreta en UTC, y en La Paz
(UTC−4) eso es el día anterior. Lo comprobé en la consola del navegador:
`new Date('2026-09-21').toString()` → `Sun Sep 20 2026`.

Escribí la regla, escribí el filtro de dominio **comparando cadenas justamente
para evitarlo**, y aun así lo metí por la puerta de atrás al etiquetar el chip
con `formatearFecha(filtros.desde)`.

El arreglo fue en `aFecha`, no en la pantalla: corregir solo la llamada dejaba
la trampa armada para el siguiente que formateara una fecha sin hora, y
`formatearFecha` acepta `string`.

> **Regla:** conocer la trampa no protege de ella. Cuando una función acepta un
> tipo que puede llegar mal, se arregla la función, no el sitio donde dolió.

### 16.25 Diagnostiqué un fallo del producto que era del entorno

Con el panel del navegador oculto, la lista de ventas salía vacía. Probé con un
parámetro, luego con otro, y concluí que «cualquier parámetro deja la lista
vacía» — una afirmación falsa y alarmante.

Lo era porque no comprobé el caso base. Al cargar `/ventas` **sin parámetros**
también salía vacía: el navegador estrangula `setTimeout` en pestañas ocultas y
el retardo de 350 ms del mock no llegaba a dispararse. `document.visibilityState`
lo decía: `"hidden"`. Con el panel visible, la lista aparece al instante.

> **Regla:** antes de declarar un fallo, reproduce el caso base. Si el caso
> base también falla, el fallo no está donde crees.

### 16.26 Entregué sin ver el resultado de la verificación

El `check` y el `build` superaron los 600 s de una orden, pasaron a segundo
plano, y la sesión terminó antes de que terminaran. Lo que vino después —la
respuesta, la documentación— se apoyaba en una verificación **que nadie leyó**.

Al repetirla por partes apareció la causa: el lint tardaba 5 min 30 s, el 95 %
en `import/no-cycle`. Y al revisar a mano salieron dos restos que ninguna
máquina veía: dos anclas `data-tour` sin paso que las usara y un import
duplicado. Ahora `audit-pantallas` caza las anclas sobrantes.

> **Regla:** si una verificación no terminó a la vista, no se hizo. Se repite
> por partes hasta ver cada salida.

### 16.27 Revertí un arreglo que no arreglaba

Para acelerar el lint añadí `ignoreExternal` a `import/no-cycle`, con un
comentario que explicaba por qué lo aceleraba. Medí: 246 s, peor que antes. La
hipótesis era falsa, y el comentario habría dejado en el código una
afirmación que no era cierta. Lo revertí.

> **Regla:** un cambio entra con su motivo medido. Si la medida lo desmiente,
> sale — aunque sea inofensivo.

### 16.28 El resumen, para leerlo antes de entregar

1. Mide antes de afirmar.
2. No dependas del fondo del vecino.
3. Busca antes de escribir: probablemente ya existe.
4. El valor por omisión es la decisión más importante.
5. Un archivo, una cosa. Los datos, fuera.
6. Sin consumidor hoy, no se escribe hoy.
7. Después de tocar algo transversal, mira alrededor.
8. Lo que cambia en producción, se prueba en producción.
9. Mirar cubre el camino feliz; el resto se escribe como prueba.
10. Una restricción va donde se decide, no donde se dibuja.
11. Guardar, confirmar y luego cerrar. Nunca al revés.
12. Antes de dibujar un filtro, comprobar que el dato existe en la respuesta.
13. Si un defecto reaparece, la causa no era la que arreglaste.
14. Un literal del dominio repetido en `presentation` es una función que falta.
15. Que el resultado salga bien no prueba que salga por el camino declarado.
16. Cambiar de vista cambia el formato, nunca la información.
17. Ante una prueba en rojo, pregunta si miente el producto o el arnés.
18. Un campo entra al esquema con el DTO delante. Las pruebas verdes no lo avalan.
19. Un filtro de categorías admite varias; lo que se desplaza se pulsa.
20. Lo que hay en una pantalla de lista, hay en las dos.
21. No se ejecuta sobre el código una herramienta que el proyecto no usa.
22. La feature que consume declara el contrato mínimo; no importa a la otra.
23. Si cambia la forma de lo que se guarda, se reprueba «solo lo que cambió».
24. Contrato e instrucción en contradicción: se anota y se pregunta, no se elige solo.
25. Conocer la trampa no protege de ella: se arregla la función, no el sitio donde dolió.
26. Antes de declarar un fallo, reproduce el caso base.
27. Si una verificación no terminó a la vista, no se hizo.
28. Un cambio sin su motivo medido, sale.
14. Una prueba verde no es una comprobación en pantalla.
