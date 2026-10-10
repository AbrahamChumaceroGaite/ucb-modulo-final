import { z } from 'zod';

/** Error body of the API: `{ status, error, message, timestamp }`, message already in Spanish. */
const errorBodySchema = z.object({
  status: z.number(),
  error: z.string(),
  message: z.string(),
});

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Keeps the API's own message; falls back to one per status when the body is not ours (a 502, say). */
  static async fromResponse(response: Response): Promise<ApiError> {
    const body = errorBodySchema.safeParse(await response.json().catch(() => null));
    if (body.success) return new ApiError(body.data.status, body.data.message);
    return new ApiError(response.status, fallbackMessage(response.status));
  }
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Tu sesión terminó. Vuelve a entrar.';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo otra vez.';
  return 'No se pudo completar la operación.';
}

/** A message a person can read, for any failure. */
export function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'No hay conexión con el servidor.';
}
