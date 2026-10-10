import { z } from 'zod';

/**
 * Configuración del entorno, validada al arrancar.
 *
 * Se valida aquí y no donde se usa: si falta la URL de la API, el fallo tiene
 * que ser al levantar el servidor y con el nombre de la variable, no una
 * petición a `undefined/api/v1/producto` tres capas más adentro.
 */
const esquemaServidor = z.object({
  API_URL: z.url({ error: 'API_URL debe ser una URL completa, p. ej. http://localhost:8080' }),
  ML_API_URL: z.url({ error: 'ML_API_URL debe ser una URL completa, p. ej. http://localhost:8082' }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const analisis = esquemaServidor.safeParse({
  API_URL: process.env.API_URL ?? 'http://localhost:8080',
  ML_API_URL: process.env.ML_API_URL ?? 'http://localhost:8082',
  NODE_ENV: process.env.NODE_ENV,
});

if (!analisis.success) {
  throw new Error(`Configuración de entorno inválida:\n${z.prettifyError(analisis.error)}`);
}

export const env = analisis.data;

/** Prefijo del backend. Está aquí y en ningún otro sitio. */
export const API_PREFIJO = '/api/v1';

/**
 * Recursos que no sirve Spring sino el servicio de predicción (NestJS,
 * `ml-api/`).
 *
 * Hablan el mismo contrato —ruta en singular bajo `/api/v1`, sin envoltorio,
 * `skip`/`limit` y el error `{ codigo, tipo, mensaje, timestamp }`— y validan
 * el mismo token, así que para el navegador no hay dos backends: hay un BFF
 * que sabe a cuál reenviar. Se decide por el primer tramo de la ruta y en
 * ningún otro sitio.
 */
export const RECURSOS_DE_PREDICCION: ReadonlySet<string> = new Set([
  'evaluacion-lote',
  'modelo-riesgo',
]);

/** Ruta del BFF de Next. El navegador solo conoce esta. */
export const BFF_PREFIJO = '/api/proxy';

/**
 * Si las pantallas hablan con datos falsos en vez de con Spring.
 *
 * Es `NEXT_PUBLIC_` porque la decisión la toma código que corre en el
 * navegador. **Por defecto está encendido** mientras el backend no esté
 * levantado: es más honesto que una pantalla que falla entera en cada carga y
 * no deja ver si el trabajo está bien hecho.
 *
 * Apagarlo es poner `NEXT_PUBLIC_MOCKS=false` en `.env.local`. Cuando el
 * backend esté en pie, esta constante y las implementaciones falsas se borran
 * juntas: no deben quedarse «por si acaso».
 */
export const USAR_MOCKS = process.env.NEXT_PUBLIC_MOCKS !== 'false';
