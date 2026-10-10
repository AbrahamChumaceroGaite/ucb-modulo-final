# Kaffehaus · Riesgo de vencimiento de lotes · Web

Proyecto final del módulo *Artificial Intelligence Capstone Project*
(Maestría, UCB Tarija). Abraham Chumacero Gaite.

Esta es la rama **`web_kaffe`**: el frontend en Next.js. Muestra, cada
mañana, qué lotes perecederos de la cafetería conviene usar primero porque es
probable que venzan sin terminarse, y permite evaluar cualquier lote con el
modelo.

## Ramas del repositorio

| Rama | Contenido |
|---|---|
| `api_kaffe` | Base de datos (Docker), API NestJS y entrenamiento del modelo (`api/`, `docker-compose.yml`). Su README explica el modelo, los datos y los resultados |
| `web_kaffe` | Este frontend (`web/`) |

La web no tiene datos ni modelo propios: todo lo pide a la API. Sin la API de
`api_kaffe` corriendo, la pantalla de lotes muestra el error de conexión.

## Levantar

1. Levantar la base y la API desde la rama `api_kaffe` (ver su README). La API
   queda en http://localhost:8082.
2. En esta rama:

   ```powershell
   cd web
   npm install
   copy .env.example .env
   npm run build
   npm start
   ```

   Queda en http://localhost:3408. `API_URL` en `.env` apunta a la API.
3. Entrar con la cuenta de desarrollo que crea `api/database/seed-admin.sql` en
   la rama `api_kaffe`.

## Qué hace la pantalla

- **Lotes abiertos**: cada lote con su probabilidad de vencer con saldo, la
  marca del umbral (14 %), el nivel (Usar primero, Vigilar, Riesgo bajo) y lo
  que diría la regla de cobertura. Filtros por nivel, familia y nombre.
- **Evaluar un lote**: formulario para escribir un lote o copiar uno de la
  lista («Probar cambios») y ver qué responde el modelo. No guarda nada.
- **Qué tan bien funciona**: recall, accuracy, precisión y aviso con 2 días,
  del modelo frente a la regla de cobertura, y los límites de la solución.
- **Cómo funciona**: recorrido guiado de la pantalla.
- Estados de carga con esqueletos, errores con el mensaje de la API y opción
  de reintentar, y aviso cuando la sesión termina.

## Cómo está armado

```
web/
├─ app/                       rutas: portada con el inicio de sesión, /vencimientos,
│                             /api/auth/* (login y logout) y /api/proxy/* (hacia la API)
└─ src/
   ├─ features/
   │  ├─ auth/                inicio de sesión, cookies de sesión y proxy hacia la API
   │  └─ expiry-risk/         lista de lotes, filtros, formulario, resultado y ficha del modelo
   └─ shared/                 cliente HTTP, errores, formato y componentes de interfaz
```

Cada feature se divide en `domain` (esquemas y reglas puras), `application`
(hooks de caso de uso), `infrastructure` (llamadas HTTP) y `presentation`
(componentes). `npm run lint` comprueba que las capas no se crucen.

Flujo de una petición:

1. El navegador llama a `/api/proxy/lot-risk`, en el mismo dominio de la web.
2. El servidor de Next lee el token de una cookie httpOnly (el JavaScript del
   navegador no puede leerla) y llama a la API con `Authorization: Bearer`.
3. Si el token venció (dura 15 minutos), el proxy pide uno nuevo con el
   refresh token y repite la petición una vez.
4. La respuesta se valida con su esquema (Zod) antes de llegar a la pantalla.

## Pruebas

```powershell
npm run check       # tipos, lint y 51 pruebas
npm run test:e2e    # 12 pruebas en el navegador (la API tiene que estar corriendo)
```

`test:e2e` usa la API y la base reales: flujo completo (entrar, ver los 17
lotes, filtrar), caso válido, caso difícil (sin historial de 28 días y revisado
el día que vence), entradas inválidas en el formulario y en la API, recorrido
guiado, cierre de sesión, consola sin errores y sin desplazamiento horizontal a
375, 768 y 1280 px. Si la API no responde, se detiene con un mensaje claro.
