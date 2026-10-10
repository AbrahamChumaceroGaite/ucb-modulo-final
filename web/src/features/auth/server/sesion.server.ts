import 'server-only';
import { cookies } from 'next/headers';
import { usuarioAutenticadoSchema, type UsuarioAutenticado } from '../domain/sesion.schema';

/**
 * La sesión, guardada en cookies `httpOnly` del dominio de Next.
 *
 * ## Por qué no `localStorage`
 *
 * El backend espera `Authorization: Bearer` y tiene `allowCredentials: false`,
 * así que el navegador no puede mandarle cookies. La salida fácil sería guardar
 * el token en `localStorage` —es lo que hace el proyecto que auditamos— y ahí
 * cualquier XSS lo lee.
 *
 * Aquí el token vive en una cookie `httpOnly` que **el JavaScript del navegador
 * no puede leer**, y es el Route Handler de Next quien la lee en el servidor y
 * añade la cabecera al llamar a Spring.
 */
const ACCESO = 'kh_access';
const REFRESCO = 'kh_refresh';
const USUARIO = 'kh_usuario';

const OPCIONES_BASE = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
} as const;

export async function guardarSesion(datos: {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioAutenticado;
}): Promise<void> {
  const almacen = await cookies();

  // El access token dura poco; el refresh sostiene la sesión.
  almacen.set(ACCESO, datos.accessToken, { ...OPCIONES_BASE, maxAge: 60 * 60 });
  almacen.set(REFRESCO, datos.refreshToken, { ...OPCIONES_BASE, maxAge: 60 * 60 * 24 * 7 });

  // Los datos visibles del usuario no son secretos —van dentro del propio JWT,
  // que es legible— pero se guardan igualmente en httpOnly para que solo el
  // servidor los lea y no haya dos versiones de quién eres.
  almacen.set(USUARIO, JSON.stringify(datos.usuario), {
    ...OPCIONES_BASE,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function actualizarAccessToken(accessToken: string): Promise<void> {
  const almacen = await cookies();
  almacen.set(ACCESO, accessToken, { ...OPCIONES_BASE, maxAge: 60 * 60 });
}

export async function leerAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESO)?.value ?? null;
}

export async function leerRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESCO)?.value ?? null;
}

/**
 * Quién está dentro, o `null`.
 *
 * Una cookie escrita a medias no debe tumbar el arranque: si no se puede
 * interpretar, se trata como «no hay sesión».
 */
export async function leerUsuario(): Promise<UsuarioAutenticado | null> {
  const crudo = (await cookies()).get(USUARIO)?.value;
  if (!crudo) return null;

  const analisis = usuarioAutenticadoSchema.safeParse(JSON.parse(crudo));
  return analisis.success ? analisis.data : null;
}

/**
 * Cierra la sesión borrando las cookies.
 *
 * El backend **no tiene endpoint de logout** (verificado en
 * `AutenticacionController`: solo login, google y refresh), así que cerrar
 * sesión es exactamente esto.
 */
export async function borrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(ACCESO);
  almacen.delete(REFRESCO);
  almacen.delete(USUARIO);
}
