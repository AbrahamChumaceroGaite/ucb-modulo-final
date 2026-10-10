import 'server-only';
import { NextResponse } from 'next/server';
import { API_PREFIX } from '@/shared/config/api';
import { serverEnv } from '@/shared/config/server-env';
import { refreshResponseSchema } from '../domain/session.schema';
import { errorResponse } from './error-response';
import { clearSession, readAccessToken, readRefreshToken, saveAccessToken } from './session-cookies';

const SESSION_OVER = 'Tu sesión terminó. Vuelve a entrar.';

/**
 * `/api/proxy/<path>` → `<API_URL>/api/v1/<path>`, adding the access token
 * from the cookie.
 *
 * Access tokens last 15 minutes. When the API answers 401, the proxy gets a
 * new one with the refresh token and repeats the request once, so a person
 * using the screen is not signed out every quarter of an hour.
 */
export async function handleProxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path = [] } = await context.params;
  const target = `${serverEnv.API_URL}${API_PREFIX}/${path.join('/')}${new URL(request.url).search}`;
  const body = request.method === 'GET' ? undefined : await request.text();

  const accessToken = await readAccessToken();
  if (!accessToken) return errorResponse(401, 'Unauthorized', SESSION_OVER);

  try {
    let response = await forward(request.method, target, body, accessToken);
    if (response.status === 401) {
      const renewed = await renewAccessToken();
      if (!renewed) return errorResponse(401, 'Unauthorized', SESSION_OVER);
      response = await forward(request.method, target, body, renewed);
    }
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return errorResponse(502, 'Unavailable', 'No se pudo contactar con la API. ¿Está levantada?');
  }
}

function forward(method: string, url: string, body: string | undefined, accessToken: string): Promise<Response> {
  return fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body,
    cache: 'no-store',
  });
}

/** A new access token, or `null` (and the session cleared) when the refresh token no longer works. */
async function renewAccessToken(): Promise<string | null> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    const response = await fetch(`${serverEnv.API_URL}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (response.ok) {
      const { accessToken } = refreshResponseSchema.parse(await response.json());
      await saveAccessToken(accessToken);
      return accessToken;
    }
  }
  await clearSession();
  return null;
}
