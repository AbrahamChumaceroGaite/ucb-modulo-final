import { resolve } from 'node:path';

/** Environment variables, validated at startup: a missing value stops the API with its name. */
export interface AppConfig {
  port: number;
  host: string;
  prefix: string;
  jwtSecret: string;
  jwtIssuer: string;
  accessTokenMinutes: number;
  refreshTokenDays: number;
  databaseUrl: string;
  modelDir: string;
  corsOrigin: string;
}

export const APP_CONFIG = Symbol('APP_CONFIG');

/** HMAC-SHA256 needs a key of at least 256 bits. */
const MIN_SECRET_BYTES = 32;

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const secret = env.JWT_SECRET ?? '';
  if (Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES) {
    throw new Error(`JWT_SECRET debe tener al menos ${MIN_SECRET_BYTES} caracteres.`);
  }

  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl.startsWith('postgres')) {
    throw new Error('DATABASE_URL debe ser una URL de PostgreSQL, por ejemplo postgres://usuario:clave@localhost:5433/kaffehausdb.');
  }

  return {
    port: positiveInt(env.PORT, 8082, 'PORT'),
    host: env.HOST ?? '0.0.0.0',
    prefix: env.API_PREFIX ?? 'api/v1',
    jwtSecret: secret,
    jwtIssuer: env.JWT_ISSUER ?? 'kaffehaus-ml',
    accessTokenMinutes: positiveInt(env.ACCESS_TOKEN_MINUTES, 15, 'ACCESS_TOKEN_MINUTES'),
    refreshTokenDays: positiveInt(env.REFRESH_TOKEN_DAYS, 7, 'REFRESH_TOKEN_DAYS'),
    databaseUrl,
    modelDir: resolve(env.MODEL_DIR ?? './model'),
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:3408',
  };
}

function positiveInt(raw: string | undefined, fallback: number, name: string): number {
  const value = Number(raw ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} debe ser un entero positivo; llegó «${raw}».`);
  }
  return value;
}
