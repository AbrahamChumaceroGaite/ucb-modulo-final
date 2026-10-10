import { z } from 'zod';
import { ApiError } from '@/shared/api/api-error';
import { usuarioAutenticadoSchema, type Credenciales } from '../domain/sesion.schema';

/**
 * Acceso a las rutas de sesión del BFF.
 *
 * No usa `http-client` porque estas rutas son de Next, no de Spring: viven en
 * `/api/auth/*` y no llevan el prefijo del proxy. Y devuelven solo los datos
 * visibles del usuario — los tokens se quedan en cookies del servidor y nunca
 * cruzan a este lado.
 */
const respuestaLoginSchema = z.object({ usuario: usuarioAutenticadoSchema });

async function postear<T>(ruta: string, schema: z.ZodType<T>, cuerpo?: unknown): Promise<T> {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    credentials: 'same-origin',
  });

  if (!respuesta.ok) throw await ApiError.desdeRespuesta(respuesta);
  return schema.parse(await respuesta.json());
}

export const authApi = {
  entrar: (credenciales: Credenciales) =>
    postear('/api/auth/login', respuestaLoginSchema, credenciales),

  /**
   * Entrada con Google. Devuelve **lo mismo** que `entrar`: quien la usa no
   * distingue por dónde entró la persona, que es lo que pide `auth.md`.
   */
  entrarConGoogle: (googleToken: string) =>
    postear('/api/auth/google', respuestaLoginSchema, { googleToken }),

  salir: () => postear('/api/auth/logout', z.object({ ok: z.boolean() })),
};
