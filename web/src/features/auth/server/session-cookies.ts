import 'server-only';
import { cookies } from 'next/headers';
import { sessionUserSchema, type SessionUser } from '../domain/session.schema';

/**
 * The session lives in httpOnly cookies of the Next.js domain: browser
 * JavaScript cannot read the tokens, so an XSS cannot steal them. The proxy
 * reads them on the server and sends `Authorization: Bearer` to the API.
 */
const ACCESS = 'kml_access';
const REFRESH = 'kml_refresh';
const USER = 'kml_user';

/** Same lifetime as the API's refresh token (REFRESH_TOKEN_DAYS). */
const SESSION_SECONDS = 60 * 60 * 24 * 7;

const OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_SECONDS,
} as const;

export async function saveSession(session: { accessToken: string; refreshToken: string; user: SessionUser }): Promise<void> {
  const store = await cookies();
  store.set(ACCESS, session.accessToken, OPTIONS);
  store.set(REFRESH, session.refreshToken, OPTIONS);
  store.set(USER, JSON.stringify(session.user), OPTIONS);
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  (await cookies()).set(ACCESS, accessToken, OPTIONS);
}

export async function readAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH)?.value ?? null;
}

/** Who is signed in, or `null`. A damaged cookie counts as no session. */
export async function readSessionUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(USER)?.value;
  if (!raw) return null;
  try {
    const parsed = sessionUserSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Signing out is deleting the cookies: the API keeps no session to close. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  for (const name of [ACCESS, REFRESH, USER]) store.delete(name);
}
