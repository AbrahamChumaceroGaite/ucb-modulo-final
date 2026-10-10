export type ErrorKind = 'Validation' | 'Unauthorized' | 'NotFound' | 'BusinessRule';

/** Business error returned (not thrown) by the domain and handlers. The message is shown to the user, in Spanish. */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly kind: ErrorKind,
  ) {
    super(message);
    this.name = 'DomainException';
    Object.setPrototypeOf(this, DomainException.prototype);
  }

  static badRequest(message: string): DomainException {
    return new DomainException(message, 400, 'Validation');
  }

  static unauthorized(message: string): DomainException {
    return new DomainException(message, 401, 'Unauthorized');
  }

  static notFound(message: string): DomainException {
    return new DomainException(message, 404, 'NotFound');
  }

  static unprocessable(message: string): DomainException {
    return new DomainException(message, 422, 'BusinessRule');
  }

  static isDomainException(value: unknown): value is DomainException {
    return value instanceof DomainException;
  }
}
