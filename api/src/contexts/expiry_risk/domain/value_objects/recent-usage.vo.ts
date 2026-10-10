import { DomainException, ValueObjectBase } from '@libs/domain';

interface Usage {
  average7d: number | null;
  average28d: number | null;
}

/** Average daily usage over the last 7 and 28 days; missing in a product's first weeks, never negative. */
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
