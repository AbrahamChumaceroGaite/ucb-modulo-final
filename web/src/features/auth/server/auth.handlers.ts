import 'server-only';
import { NextResponse } from 'next/server';
import { API_PREFIX } from '@/shared/config/api';
import { serverEnv } from '@/shared/config/server-env';
import { credentialsSchema, loginResponseSchema } from '../domain/session.schema';
import { errorResponse } from './error-response';
import { clearSession, saveSession } from './session-cookies';

/** `POST /api/auth/login`: signs in against the API and keeps the tokens in cookies. */
export async function handleSignIn(request: Request): Promise<NextResponse> {
  const credentials = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!credentials.success) return errorResponse(400, 'Validation', 'Revisa el correo y la contraseña.');

  let response: Response;
  try {
    response = await fetch(`${serverEnv.API_URL}${API_PREFIX}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials.data),
      cache: 'no-store',
    });
  } catch {
    return errorResponse(502, 'Unavailable', 'No se pudo contactar con la API. ¿Está levantada?');
  }

  // The API's own message ("Correo o contraseña incorrectos.") goes back unchanged.
  if (!response.ok) {
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = loginResponseSchema.parse(await response.json());
  await saveSession(session);
  // Only the visible user data crosses to the browser, never the tokens.
  return NextResponse.json({ user: session.user });
}

/** `POST /api/auth/logout` */
export async function handleSignOut(): Promise<NextResponse> {
  await clearSession();
  return NextResponse.json({ ok: true });
}
