import { z } from 'zod';
import { ApiError } from '@/shared/api/api-error';
import { sessionUserSchema, type Credentials } from '../domain/session.schema';

/** Calls to the Next.js session routes (`/api/auth/*`), not to the API itself. */
async function post<T>(path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor.');
  }
  if (!response.ok) throw await ApiError.fromResponse(response);
  return schema.parse(await response.json());
}

export const authApi = {
  signIn: (credentials: Credentials) => post('/api/auth/login', z.object({ user: sessionUserSchema }), credentials),
  signOut: () => post('/api/auth/logout', z.object({ ok: z.boolean() })),
};
