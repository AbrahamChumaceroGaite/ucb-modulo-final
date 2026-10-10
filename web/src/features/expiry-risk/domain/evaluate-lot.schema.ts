import { z } from 'zod';
import type { LotRisk } from './lot-risk.schema';

const NOT_A_NUMBER = 'Escribe un número.';
const NEGATIVE = 'No puede ser negativo.';

const date = z.iso.date({ error: 'Elige una fecha.' });

/** A text input that must hold a number of zero or more. */
const amount = (missing: string) =>
  z.string().trim().min(1, missing).transform(Number).pipe(z.number({ error: NOT_A_NUMBER }).min(0, NEGATIVE));

/**
 * The evaluation form. It only checks that each field is filled and numeric;
 * rules between fields are checked by the API, which answers 422 with the reason.
 */
export const evaluateLotSchema = z.object({
  productId: z.string().min(1, 'Elige un producto.'),
  receivedOn: date,
  expiresOn: date,
  reviewedOn: date,
  initialQuantity: z
    .string()
    .trim()
    .min(1, 'Escribe la cantidad inicial.')
    .transform(Number)
    .pipe(z.number({ error: NOT_A_NUMBER }).positive('Tiene que ser mayor que cero.')),
  remainingQuantity: amount('Escribe cuánto queda.'),
  stockAhead: amount('Escribe 0 si no hay lotes por delante.'),
  usage7d: amount('Escribe el uso diario.'),
  // Optional: a new product has no 28-day history (the model handles the gap).
  usage28d: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value)))
    .pipe(z.number({ error: NOT_A_NUMBER }).min(0, NEGATIVE).nullable()),
});

/** What the inputs hold (text) and what `POST /lot-risk/evaluate` receives (numbers). */
export type EvaluateLotForm = z.input<typeof evaluateLotSchema>;
export type EvaluateLotRequest = z.output<typeof evaluateLotSchema>;

export function emptyForm(reviewedOn: string): EvaluateLotForm {
  return {
    productId: '',
    receivedOn: '',
    expiresOn: '',
    reviewedOn,
    initialQuantity: '',
    remainingQuantity: '',
    stockAhead: '0',
    usage7d: '',
    usage28d: '',
  };
}

/** A lot from the list, copied into the form to try variations on it. */
export function formFromLot(lot: LotRisk): EvaluateLotForm {
  return {
    productId: lot.product.id,
    receivedOn: lot.receivedOn,
    expiresOn: lot.expiresOn,
    reviewedOn: lot.reviewedOn,
    initialQuantity: String(lot.initialQuantity),
    remainingQuantity: String(lot.remainingQuantity),
    stockAhead: String(lot.stockAhead),
    usage7d: lot.usage7d === null ? '' : String(lot.usage7d),
    usage28d: lot.usage28d === null ? '' : String(lot.usage28d),
  };
}
