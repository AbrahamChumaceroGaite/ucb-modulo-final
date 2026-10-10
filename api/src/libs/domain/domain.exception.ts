export type ErrorKind = 'Validation' | 'Unauthorized' | 'NotFound' | 'BusinessRule';

/**
 * Business error, returned (not thrown) by the domain and the handlers.
 *
 * Same pattern as the course examples (`ucb-smc-api-v2`): the error travels
 * back up as a value and the controller decides. The message is written for
 * a person, in Spanish, because the web shows it as it comes.
 */
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
