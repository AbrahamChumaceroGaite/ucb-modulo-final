import { DomainException, ValueObjectBase } from '@libs/domain';

interface Usage {
  average7d: number | null;
  average28d: number | null;
}

/**
 * Average daily usage of the product over the last 7 and 28 days.
 *
 * Either can be missing: a product in its first weeks has no full window
 * yet, and the model was trained with those gaps. What cannot happen is a
 * negative average.
 */
export class RecentUsage extends ValueObjectBase<Usage> {
  private constructor(value: Usage) {
    super(value);
  }

  static create(usage: Usage): RecentUsage | DomainException {
    if (usage.average7d !== null && !(usage.average7d >= 0)) {
      return DomainException.badRequest('El consumo de los últimos 7 días no puede ser negativo.');
    }
    if (usage.average28d !== null && !(usage.average28d >= 0)) {
      return DomainException.badRequest('El consumo de los últimos 28 días no puede ser negativo.');
    }
    return new RecentUsage(usage);
  }
}
