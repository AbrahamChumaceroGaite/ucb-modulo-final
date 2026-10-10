import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException, type ErrorKind } from '../../domain/domain.exception';

export interface ErrorBody {
  status: number;
  error: ErrorKind | 'HttpError' | 'InternalError';
  message: string;
  timestamp: string;
}

/**
 * Every error leaves with the same body: `{ status, error, message, timestamp }`.
 * The web shows `message` as it comes, so it is written in Spanish for a person.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = toErrorBody(exception);
    response.status(body.status).json(body);
  }
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
