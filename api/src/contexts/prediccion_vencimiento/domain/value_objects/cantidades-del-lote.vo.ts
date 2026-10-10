import { DomainException, ValueObjectBase } from '@libs';

interface Cantidades {
  inicial: number;
  restante: number;
  porDelante: number;
}

/**
 * How much was bought, how much is left and how much of the same item will
 * be used before this lot (FEFO queue).
 */
export class CantidadesDelLote extends ValueObjectBase<Cantidades> {
  private constructor(value: Cantidades) {
    super(value);
  }

  static create(cantidades: Cantidades): CantidadesDelLote | DomainException {
    const { inicial, restante, porDelante } = cantidades;
    if (!(inicial > 0)) {
      return DomainException.badRequest('La cantidad comprada tiene que ser mayor que cero.');
    }
    if (!(restante > 0)) {
      return DomainException.unprocessable('Al lote no le queda nada: no hay riesgo que evaluar.');
    }
    if (restante > inicial) {
      return DomainException.unprocessable('No puede quedar más de lo que se compró.');
    }
    if (porDelante < 0) {
      return DomainException.badRequest('El stock por delante no puede ser negativo.');
    }
    return new CantidadesDelLote(cantidades);
  }

  static createFromPersistence(cantidades: Cantidades): CantidadesDelLote {
    return new CantidadesDelLote(cantidades);
  }
}
