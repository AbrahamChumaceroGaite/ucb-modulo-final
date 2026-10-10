import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException, type ErrorKind } from '../../domain/domain.exception';

export interface ErrorBody {
  status: number;
  error: ErrorKind | 'HttpError' | 'Unavailable' | 'InternalError';
  message: string;
  timestamp: string;
}

/**
 * Every error leaves with the same body: `{ status, error, message, timestamp }`.
 * The web shows `message` as it comes, so it is written in Spanish for a person.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = toErrorBody(exception);
    // The person gets a short message; the cause goes to the log, or nobody can find it.
    if (body.status >= 500) this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(body.status).json(body);
  }
}

/**
 * What `pg` raises when PostgreSQL is not there: a refused or timed-out
 * socket, a server still starting (57P03), or one that drops the connection,
 * which comes without a code.
 */
const DATABASE_DOWN_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P03']);

function isDatabaseDown(exception: unknown): boolean {
  if (!(exception instanceof Error)) return false;
  const code = String((exception as { code?: unknown }).code);
  return DATABASE_DOWN_CODES.has(code) || exception.message.startsWith('Connection terminated');
}

function toErrorBody(exception: unknown): ErrorBody {
  const timestamp = new Date().toISOString();

  if (DomainException.isDomainException(exception)) {
    return { status: exception.status, error: exception.kind, message: exception.message, timestamp };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return { status, error: kindOf(status), message: messageOf(exception.getResponse(), status), timestamp };
  }

  if (isDatabaseDown(exception)) {
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Unavailable',
      message: 'La base de datos no responde. ¿Está levantado el contenedor (docker compose up -d)?',
      timestamp,
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'InternalError',
    message: 'El servicio tuvo un problema. Inténtalo otra vez.',
    timestamp,
  };
}

function kindOf(status: number): ErrorBody['error'] {
  if (status === 400) return 'Validation';
  if (status === 401) return 'Unauthorized';
  if (status === 404) return 'NotFound';
  return 'HttpError';
}

/** Nest's own 404 ("Cannot GET /x") is in English and names internals; it is replaced. */
function messageOf(body: string | object, status: number): string {
  if (status === 404) return 'La ruta pedida no existe.';
  if (typeof body === 'string') return body;
  const message = (body as { message?: unknown }).message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  if (typeof message === 'string') return message;
  return 'La solicitud no es válida.';
}
