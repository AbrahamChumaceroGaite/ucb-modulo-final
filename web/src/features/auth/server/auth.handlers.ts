import 'server-only';
import { NextResponse } from 'next/server';
import { API_PREFIJO, env } from '@/shared/config/env';
import {
  accessTokenSchema,
  autenticacionSchema,
  credencialesSchema,
  googleSchema,
} from '../domain/sesion.schema';
import {
  actualizarAccessToken,
  borrarSesion,
  guardarSesion,
  leerRefreshToken,
} from './sesion.server';

/**
 * La mitad de servidor del acceso: el BFF.
 *
 * Vive aquí y no en `app/api/**` a propósito. `app/` solo enruta: sus archivos
 * de ruta son dos líneas que apuntan a estas funciones. Así la regla de capas
 * se mantiene —`app` no importa dominio ni infraestructura— y la lógica de
 * sesión queda junto al resto de su feature.
 *
 * Lo que hacen estas funciones y por qué importa: reciben del navegador,
 * hablan con Spring y **guardan los tokens en cookies httpOnly**. Al navegador
 * solo le vuelven los datos visibles del usuario.
 */

const CABECERA_JSON = { 'Content-Type': 'application/json' } as const;

export async function manejarLogin(peticion: Request): Promise<NextResponse> {
  const credenciales = credencialesSchema.safeParse(await peticion.json());

  if (!credenciales.success) {
    return errorJson(400, 'Validación', 'Revisa el correo y la contraseña.');
  }

  const respuesta = await fetch(`${env.API_URL}${API_PREFIJO}/auth/login`, {
    method: 'POST',
    headers: CABECERA_JSON,
    body: JSON.stringify(credenciales.data),
    cache: 'no-store',
  });

  if (!respuesta.ok) {
    // El mensaje del backend se reenvía intacto: es quien sabe por qué falló.
    return new NextResponse(await respuesta.text(), {
      status: respuesta.status,
      headers: CABECERA_JSON,
    });
  }

  const datos = autenticacionSchema.safeParse(await respuesta.json());
  if (!datos.success) {
    return errorJson(502, 'ContratoRoto', 'La respuesta de acceso no tiene la forma esperada.');
  }

  await guardarSesion(datos.data);
  return NextResponse.json({ usuario: datos.data.usuario });
}

/**
 * Entrada con Google.
 *
 * El navegador manda el `id_token` que le dio Google y **nada más**: quien
 * habla con Spring es este handler, y el access token sigue sin cruzar al
 * cliente. Es el mismo camino que `manejarLogin`, con otro cuerpo.
 *
 * `auth.md` lo dice con claridad y conviene repetirlo aquí: **Google acredita,
 * no da acceso.** Si el correo verificado no corresponde a un usuario que ya
 * existe, la respuesta es 401 y no se crea nada. El mensaje del backend se
 * reenvía intacto porque es el único que sabe cuál de los tres casos falló.
 */
export async function manejarLoginConGoogle(peticion: Request): Promise<NextResponse> {
  const cuerpo = googleSchema.safeParse(await peticion.json());

  if (!cuerpo.success) {
    return errorJson(400, 'Validación', 'Falta el token de Google.');
  }

  const respuesta = await fetch(`${env.API_URL}${API_PREFIJO}/auth/google`, {
    method: 'POST',
    headers: CABECERA_JSON,
    body: JSON.stringify(cuerpo.data),
    cache: 'no-store',
  });

  if (!respuesta.ok) {
    return new NextResponse(await respuesta.text(), {
      status: respuesta.status,
      headers: CABECERA_JSON,
    });
  }

  const datos = autenticacionSchema.safeParse(await respuesta.json());
  if (!datos.success) {
    return errorJson(502, 'ContratoRoto', 'La respuesta de acceso no tiene la forma esperada.');
  }

  await guardarSesion(datos.data);
  return NextResponse.json({ usuario: datos.data.usuario });
}

/**
 * Renueva el access token con el refresh guardado.
 *
 * Se puede probar de punta a punta, que es la diferencia con el proyecto que
 * auditamos: allí el servicio de renovación se saltaba su propio interceptor y
 * ningún doble lo atendía, así que **nunca llegó a ejecutarse**.
 */
export async function manejarRefresh(): Promise<NextResponse> {
  const refreshToken = await leerRefreshToken();
  if (!refreshToken) return errorJson(401, 'SinSesion', 'Tu sesión terminó. Vuelve a entrar.');

  const respuesta = await fetch(`${env.API_URL}${API_PREFIJO}/auth/refresh`, {
    method: 'POST',
    headers: CABECERA_JSON,
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!respuesta.ok) {
    // El refresh tampoco vale: la sesión se acabó de verdad.
    await borrarSesion();
    return errorJson(401, 'SesionExpirada', 'Tu sesión terminó. Vuelve a entrar.');
  }

  const datos = accessTokenSchema.safeParse(await respuesta.json());
  if (!datos.success) {
    return errorJson(502, 'ContratoRoto', 'La renovación no tiene la forma esperada.');
  }

  await actualizarAccessToken(datos.data.accessToken);
  return NextResponse.json({ ok: true });
}

/** Cerrar sesión: borrar las cookies. Spring no tiene endpoint de logout. */
export async function manejarLogout(): Promise<NextResponse> {
  await borrarSesion();
  return NextResponse.json({ ok: true });
}

function errorJson(codigo: number, tipo: string, mensaje: string): NextResponse {
  return NextResponse.json(
    { codigo, tipo, mensaje, timestamp: new Date().toISOString() },
    { status: codigo },
  );
}
