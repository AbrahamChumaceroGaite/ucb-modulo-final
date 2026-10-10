import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';

/**
 * Every error leaves in the Spring shape: `{ codigo, tipo, mensaje, timestamp }`.
 *
 * Verified against `GlobalExceptionHandler.ErrorResponse` in kaffehausv4 and
 * against `api-error.ts` in the web, which parses exactly these four fields.
 * The web does not rewrite server messages (RULES §2.4), so `mensaje` is
 * written here for a person, in Spanish.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(excepcion: unknown, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const { codigo, tipo, mensaje } = traducir(excepcion);
    respuesta.status(codigo).json({ codigo, tipo, mensaje, timestamp: new Date().toISOString() });
  }
}

function traducir(excepcion: unknown): { codigo: number; tipo: string; mensaje: string } {
  if (DomainException.isDomainException(excepcion)) {
    return { codigo: excepcion.code, tipo: excepcion.tipo, mensaje: excepcion.message };
  }

  if (excepcion instanceof HttpException) {
    const codigo = excepcion.getStatus();
    return { codigo, tipo: tipoPorEstado(codigo), mensaje: mensajeDe(excepcion.getResponse(), codigo) };
  }

  return {
    codigo: HttpStatus.INTERNAL_SERVER_ERROR,
    tipo: 'ErrorInterno',
    mensaje: 'El servicio de predicción tuvo un problema. Inténtalo otra vez.',
  };
}

function tipoPorEstado(codigo: number): string {
  if (codigo === 400) return 'Validación';
  if (codigo === 401) return 'NoAutorizado';
  if (codigo === 404) return 'NoEncontrado';
  return 'HttpError';
}

/**
 * class-validator returns a list. The first message is shown: it is the one
 * the person can act on, and the web shows a single line.
 */
function mensajeDe(cuerpo: string | object, codigo: number): string {
  if (typeof cuerpo === 'string') return cuerpo;
  const mensaje = (cuerpo as { message?: unknown }).message;
  if (Array.isArray(mensaje) && typeof mensaje[0] === 'string') return mensaje[0];
  if (typeof mensaje === 'string' && codigo !== 404) return mensaje;
  return codigo === 404 ? 'La ruta pedida no existe en el servicio de predicción.' : 'La solicitud no es válida.';
}
