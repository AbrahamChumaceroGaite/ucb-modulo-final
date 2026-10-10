import { z } from 'zod';
import { contrasena, correo } from '@/shared/lib/validation';
import { perfilSchema } from './perfil';

/**
 * Contrato de sesión, tomado del backend.
 *
 * Verificado en `AutenticacionController` y `UsuarioAutenticado`:
 * se entra con **correo**, y el token lleva exactamente cuatro campos.
 *
 * El rol viaja **por nombre** y sale de la base en cada login. Aquí no hay un
 * catálogo de roles escrito a mano: inventarlo garantiza que se desincronice
 * el día que alguien añada un rol en la base.
 */
export const credencialesSchema = z.object({
  email: correo,
  password: contrasena,
});

export const usuarioAutenticadoSchema = z.object({
  usuarioId: z.string(),
  nombreCompleto: z.string(),
  rolId: z.string(),
  rolNombre: z.string(),
});

/**
 * Lo que rellena el formulario de acceso.
 *
 * Es `credenciales` **más** el perfil elegido, y esa separación no es
 * cosmética: `credencialesSchema` describe lo que viaja a Spring y el perfil
 * no viaja —el backend no lo acepta ni lo necesita—, así que el caso de uso lo
 * usa y lo deja aquí. Mezclarlos en un solo esquema haría que el contrato de
 * la API dependiera de una decisión de interfaz.
 */
export const accesoSchema = credencialesSchema.extend({ perfil: perfilSchema });

/**
 * Lo que acepta `POST /api/v1/auth/google`: el `id_token` que devolvió Google.
 *
 * Se llama `googleToken` y no `idToken` porque así lo nombra el backend en
 * `auth.md`. El nombre del campo es parte del contrato, no una preferencia.
 */
export const googleSchema = z.object({
  googleToken: z.string().min(1, 'Falta el token de Google'),
});

/** Lo que devuelve `POST /api/v1/auth/login`. */
export const autenticacionSchema = z.object({
  usuario: usuarioAutenticadoSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

/** Lo que devuelve `POST /api/v1/auth/refresh`: solo el access token. */
export const accessTokenSchema = z.object({
  accessToken: z.string(),
});

export type Credenciales = z.infer<typeof credencialesSchema>;
export type Acceso = z.infer<typeof accesoSchema>;
export type UsuarioAutenticado = z.infer<typeof usuarioAutenticadoSchema>;
