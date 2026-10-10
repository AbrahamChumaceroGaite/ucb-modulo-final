import { DomainException } from '../domain/domain.exception';

/**
 * Handlers return `T | DomainException`. The controller returns the bare DTO,
 * without an envelope; a business error is thrown here and the global filter
 * writes the error body.
 */
export function unwrap<T>(result: T | DomainException): T {
  if (DomainException.isDomainException(result)) throw result;
  return result;
}
