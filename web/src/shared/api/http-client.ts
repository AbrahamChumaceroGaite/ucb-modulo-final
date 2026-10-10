import type { z } from 'zod';
import { BFF_PREFIX } from '@/shared/config/api';
import { ApiError } from './api-error';

/**
 * The only place the browser calls the API from. Requests go to the Next.js
 * proxy, which holds the token in an httpOnly cookie, and every response is
 * parsed with its schema so a contract change fails here, by field name.
 */
async function request<T>(method: 'GET' | 'POST', path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BFF_PREFIX}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor.');
  }
  if (!response.ok) throw await ApiError.fromResponse(response);
  return schema.parse(await response.json());
}

export const http = {
  get: <T>(path: string, schema: z.ZodType<T>) => request('GET', path, schema),
  post: <T>(path: string, body: unknown, schema: z.ZodType<T>) => request('POST', path, schema, body),
};
