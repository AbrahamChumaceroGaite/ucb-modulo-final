/**
 * Business error, returned (not thrown) by the domain and the handlers.
 *
 * Same pattern as `ucb-smc-api-v2`: a value object travels back up the call
 * chain and the controller decides. What changes is the `tipo`: the web
 * consumes the Spring contract `{ codigo, tipo, mensaje, timestamp }`, so the
 * exception carries the `tipo` that ends up in that body.
 */
export class DomainException extends Error {
  public readonly code: number;
  public readonly tipo: string;

  constructor(message: string, code: number, tipo: string) {
    super(message);
    this.name = 'DomainException';
    this.code = code;
    this.tipo = tipo;
    Object.setPrototypeOf(this, DomainException.prototype);
  }

  static badRequest(message: string): DomainException {
    return new DomainException(message, 400, 'Validación');
  }

  static unauthorized(message: string): DomainException {
    return new DomainException(message, 401, 'NoAutorizado');
  }

  static notFound(message: string): DomainException {
    return new DomainException(message, 404, 'NoEncontrado');
  }

  static unprocessable(message: string): DomainException {
    return new DomainException(message, 422, 'ReglaDeNegocio');
  }

  static isDomainException(valor: unknown): valor is DomainException {
    return valor instanceof DomainException;
  }
}
