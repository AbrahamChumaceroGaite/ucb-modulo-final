import { resolve } from 'node:path';
import type { AppConfig } from '../infrastructure/config/app-config';

/** The model the API ships with, the same files `npm start` reads. */
export const MODEL_DIR = resolve(__dirname, '../../../model');

/** A complete configuration for tests: the real model, a throwaway secret and no database. */
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 0,
    host: '127.0.0.1',
    prefix: 'api/v1',
    jwtSecret: 'secreto-de-pruebas-de-al-menos-32-bytes',
    jwtIssuer: 'kaffehaus-ml',
    accessTokenMinutes: 15,
    refreshTokenDays: 7,
    databaseUrl: 'postgres://tests-do-not-connect',
    modelDir: MODEL_DIR,
    corsOrigin: 'http://localhost:3408',
    ...overrides,
  };
}
