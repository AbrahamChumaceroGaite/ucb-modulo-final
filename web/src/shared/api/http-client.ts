import { z } from 'zod';
import { ApiError } from './api-error';
import { BFF_PREFIJO } from '@/shared/config/env';

/**
 * Único punto de salida HTTP del proyecto. Ningún componente, hook ni feature
 * llama a `fetch` por su cuenta.
 *
 * ## Solo cuatro verbos
 *
 * No existe `put`. Las actualizaciones son parciales, así que el verbo es
 * PATCH. Como el método no está expuesto, escribirlo no compila — no depende
 * de que alguien recuerde la regla.
 *
 * ## El token no pasa por aquí
 *
 * Las peticiones van al BFF de Next (`/api/proxy/...`), que es quien añade
 * `Authorization: Bearer` contra Spring. El navegador nunca ve el token: vive
 * en una cookie httpOnly. Auditamos un proyecto que los guarda en
 * `localStorage`, donde cualquier XSS los lee.
 *
 * ## Se valida lo que entra
 *
 * Toda respuesta pasa por `schema.parse()`. Si el backend cambia un campo, el
 * fallo ocurre aquí, con el nombre del campo, y no tres capas más adentro con
 * un `undefined` inexplicable.
 */

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function peticion<T>(
  metodo: Metodo,
  ruta: string,
  schema: z.ZodType<T>,
  cuerpo?: unknown,
): Promise<T> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${BFF_PREFIJO}${ruta}`, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      // El BFF necesita la cookie de sesión; es del mismo origen.
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'NetworkError', 'Sin conexión con el servidor.');
  }

  if (!respuesta.ok) throw await ApiError.desdeRespuesta(respuesta);

  // 204 y DELETE no traen cuerpo: no hay nada que analizar.
  if (respuesta.status === 204 || respuesta.headers.get('content-length') === '0') {
    return schema.parse(null);
  }

  return schema.parse(await respuesta.json());
}

/** Query string a partir de los parámetros, descartando lo vacío. */
function query(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue;
    busqueda.set(clave, String(valor));
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : '';
}

export const http = {
  get: <T>(
    ruta: string,
    schema: z.ZodType<T>,
    params?: Record<string, string | number | boolean | undefined | null>,
  ) => peticion('GET', `${ruta}${query(params)}`, schema),

  post: <T>(ruta: string, cuerpo: unknown, schema: z.ZodType<T>) =>
    peticion('POST', ruta, schema, cuerpo),

  /** Actualización parcial. Manda solo lo que cambió (ver `to-patch.ts`). */
  patch: <T>(ruta: string, cuerpo: unknown, schema: z.ZodType<T>) =>
    peticion('PATCH', ruta, schema, cuerpo),

  /**
   * Baja lógica. No lleva esquema porque **no hay nada que validar**: el
   * backend responde 204 sin cuerpo en todos sus `DELETE`. Lo llevó durante un
   * tiempo y lo único que producía era un `z.null()` repetido en cada feature.
   */
  del: (ruta: string): Promise<void> =>
    peticion('DELETE', ruta, z.null()).then(() => undefined),
};
