import { DomainException } from '../domain/domain.exception';

/** Handlers return `T | DomainException`: the value goes out as is, the error is thrown to the global filter. */
export function unwrap<T>(result: T | DomainException): T {
  if (DomainException.isDomainException(result)) throw result;
  return result;
}
