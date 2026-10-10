import { DomainException, ValueObjectBase } from '@libs';

interface Consumo {
  promedio7d: number;
  promedio28d: number | null;
}

/**
 * Average daily consumption of the item, as the kardex registers it.
 *
 * The 7-day average is required: without it neither the rule nor the model
 * can say anything useful. The 28-day one is optional, because a new item
 * does not have four weeks of history yet; the model was trained with those
 * gaps and handles them.
 */
export class ConsumoReciente extends ValueObjectBase<Consumo> {
  private constructor(value: Consumo) {
    super(value);
  }

  static create(consumo: Consumo): ConsumoReciente | DomainException {
    if (!(consumo.promedio7d >= 0)) {
      return DomainException.badRequest('El consumo de los últimos 7 días no puede ser negativo.');
    }
    if (consumo.promedio28d !== null && !(consumo.promedio28d >= 0)) {
      return DomainException.badRequest('El consumo de los últimos 28 días no puede ser negativo.');
    }
    return new ConsumoReciente(consumo);
  }

  static createFromPersistence(consumo: Consumo): ConsumoReciente {
    return new ConsumoReciente(consumo);
  }
}
