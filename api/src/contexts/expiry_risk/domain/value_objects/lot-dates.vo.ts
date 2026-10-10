import { DomainException, ValueObjectBase } from '@libs/domain';
import { dayNumber, isIsoDate } from '../services/iso-date';

interface Dates {
  receivedOn: string;
  expiresOn: string;
  reviewedOn: string;
}

const LABELS: Record<keyof Dates, string> = {
  receivedOn: 'ingreso',
  expiresOn: 'vencimiento',
  reviewedOn: 'revisión',
};

/** Received, expiry and review dates. An already expired lot is rejected: training rows stop on the expiry day. */
export class LotDates extends ValueObjectBase<Dates> {
  private constructor(value: Dates) {
    super(value);
  }

  static create(dates: Dates): LotDates | DomainException {
    for (const key of Object.keys(LABELS) as (keyof Dates)[]) {
      if (!isIsoDate(dates[key])) {
        return DomainException.badRequest(`La fecha de ${LABELS[key]} debe tener la forma AAAA-MM-DD.`);
      }
    }

    const received = dayNumber(dates.receivedOn);
    const expires = dayNumber(dates.expiresOn);
    const reviewed = dayNumber(dates.reviewedOn);

    if (expires <= received) {
      return DomainException.unprocessable('La fecha de vencimiento tiene que ser posterior a la de ingreso.');
    }
    if (reviewed < received) {
      return DomainException.unprocessable('No se puede revisar un lote antes de que entre a la despensa.');
    }
    if (reviewed > expires) {
      return DomainException.unprocessable('El lote ya venció en la fecha de revisión: lo que queda es merma, no un riesgo.');
    }
    return new LotDates(dates);
  }
}
