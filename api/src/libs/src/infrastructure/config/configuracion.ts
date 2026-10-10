import { resolve } from 'node:path';

/**
 * Environment, validated once at startup.
 *
 * A missing secret must stop the service with the variable's name, not turn
 * every request into an opaque 401 three layers deeper.
 */
export interface Configuracion {
  puerto: number;
  host: string;
  prefijo: string;
  jwtSecreto: string;
  jwtEmisor: string;
  modeloDir: string;
  origenCors: string;
}

export const CONFIGURACION = Symbol('CONFIGURACION');

/** HMAC needs at least 256 bits; Spring enforces the same minimum. */
const LONGITUD_MINIMA_SECRETO = 32;

export function leerConfiguracion(entorno: NodeJS.ProcessEnv = process.env): Configuracion {
  const secreto = entorno.JWT_SECRET ?? '';
  if (Buffer.byteLength(secreto, 'utf8') < LONGITUD_MINIMA_SECRETO) {
    throw new Error(
      `JWT_SECRET debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres y ser el mismo que usa Spring (seguridad.jwt.secreto-acceso).`,
    );
  }

  const puerto = Number(entorno.PORT ?? 8082);
  if (!Number.isInteger(puerto) || puerto <= 0) {
    throw new Error(`PORT debe ser un entero positivo; llegó «${entorno.PORT}».`);
  }

  return {
    puerto,
    host: entorno.HOST ?? '0.0.0.0',
    prefijo: entorno.API_PREFIJO ?? 'api/v1',
    jwtSecreto: secreto,
    jwtEmisor: entorno.JWT_ISSUER ?? 'kaffehausv4',
    modeloDir: resolve(entorno.MODELO_DIR ?? './modelo'),
    origenCors: entorno.CORS_ORIGIN ?? 'http://localhost:3408',
  };
}
