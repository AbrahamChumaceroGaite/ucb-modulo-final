import 'server-only';
import { z } from 'zod';

/**
 * Server environment, checked once on import. A wrong URL fails at startup
 * with the variable's name instead of on the first request.
 */
const schema = z.object({
  API_URL: z.url({ error: 'API_URL debe ser una URL completa, por ejemplo http://localhost:8082' }),
});

const parsed = schema.safeParse({ API_URL: process.env.API_URL ?? 'http://localhost:8082' });
if (!parsed.success) throw new Error(z.prettifyError(parsed.error));

export const serverEnv = parsed.data;
