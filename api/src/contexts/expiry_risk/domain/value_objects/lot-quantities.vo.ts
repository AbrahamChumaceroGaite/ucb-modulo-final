import { DomainException, ValueObjectBase } from '@libs/domain';

interface Quantities {
  initial: number;
  remaining: number;
  ahead: number;
}

/** Initial, remaining and ahead-in-FEFO quantities, in the product's unit (ml, g or und). */
export class LotQuantities extends ValueObjectBase<Quantities> {
  private constructor(value: Quantities) {
    super(value);
  }

  static create(quantities: Quantities): LotQuantities | DomainException {
    const { initial, remaining, ahead } = quantities;
    if (!(initial > 0)) {
      return DomainException.badRequest('La cantidad del lote tiene que ser mayor que cero.');
    }
    if (!(remaining > 0)) {
      return DomainException.unprocessable('Al lote no le queda nada: no hay riesgo que evaluar.');
    }
    if (remaining > initial) {
      return DomainException.unprocessable('No puede quedar más de lo que tenía el lote.');
    }
    if (!(ahead >= 0)) {
      return DomainException.badRequest('El stock por delante no puede ser negativo.');
    }
    return new LotQuantities(quantities);
  }
}
