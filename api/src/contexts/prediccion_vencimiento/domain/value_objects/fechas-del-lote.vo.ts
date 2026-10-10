import { DomainException, ValueObjectBase } from '@libs';
import { diaDe, esFechaValida } from '../services/fecha';

interface Fechas {
  ingreso: string;
  vencimiento: string;
  revision: string;
}

/**
 * The three dates of a review, consistent with each other.
 *
 * A lot that already expired is not evaluated: the question "will it expire
 * before it is used" no longer has an answer, and the model never saw that
 * case (training rows stop on the expiry day).
 */
export class FechasDelLote extends ValueObjectBase<Fechas> {
  private constructor(value: Fechas) {
    super(value);
  }

  static create(fechas: Fechas): FechasDelLote | DomainException {
    for (const [nombre, valor] of [
      ['ingreso', fechas.ingreso],
      ['vencimiento', fechas.vencimiento],
      ['revisión', fechas.revision],
    ] as const) {
      if (!esFechaValida(valor)) {
        return DomainException.badRequest(`La fecha de ${nombre} debe tener la forma AAAA-MM-DD.`);
      }
    }

    const ingreso = diaDe(fechas.ingreso);
    const vence = diaDe(fechas.vencimiento);
    const revision = diaDe(fechas.revision);

    if (vence <= ingreso) {
      return DomainException.unprocessable('La fecha de vencimiento tiene que ser posterior a la de ingreso.');
    }
    if (revision < ingreso) {
      return DomainException.unprocessable('No se puede revisar un lote antes de que entre a la despensa.');
    }
    if (revision > vence) {
      return DomainException.unprocessable(
        'El lote ya venció en la fecha de revisión: lo que queda es merma, no un riesgo.',
      );
    }
    return new FechasDelLote(fechas);
  }

  static createFromPersistence(fechas: Fechas): FechasDelLote {
    return new FechasDelLote(fechas);
  }

  get diasParaVencer(): number {
    return diaDe(this._value.vencimiento) - diaDe(this._value.revision);
  }
}
