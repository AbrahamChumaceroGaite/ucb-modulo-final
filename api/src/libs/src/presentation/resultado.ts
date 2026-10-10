import { DomainException } from '../domain/exceptions/domain.exception';

/**
 * Handlers return `T | DomainException` (SMC pattern). The controller does not
 * wrap the value in an envelope, because the consumer expects the bare DTO
 * (RULES §2.2 of the web): a business error is thrown here and the global
 * filter turns it into `{ codigo, tipo, mensaje, timestamp }`.
 */
export function desenvolver<T>(resultado: T | DomainException): T {
  if (DomainException.isDomainException(resultado)) throw resultado;
  return resultado;
}
