import { describe, expect, it } from 'vitest';
import { cookiesLot } from '../testing/fixtures';
import { emptyForm, evaluateLotSchema, formFromLot, type EvaluateLotForm } from './evaluate-lot.schema';

const filled: EvaluateLotForm = formFromLot(cookiesLot);

function firstError(change: Partial<EvaluateLotForm>): string | undefined {
  const result = evaluateLotSchema.safeParse({ ...filled, ...change });
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('evaluateLotSchema', () => {
  it('turns the typed text into the body the API expects', () => {
    expect(evaluateLotSchema.parse({ ...filled, usage28d: ' 8.5 ' })).toEqual({
      productId: cookiesLot.product.id,
      receivedOn: '2026-10-01',
      expiresOn: '2026-10-08',
      reviewedOn: '2026-10-04',
      initialQuantity: 48,
      remainingQuantity: 48,
      stockAhead: 2,
      usage7d: 8.4286,
      usage28d: 8.5,
    });
  });

  it('sends a blank 28-day usage as null, the gap the model was trained with', () => {
    expect(evaluateLotSchema.parse({ ...filled, usage28d: '' }).usage28d).toBeNull();
  });

  it.each<[string, Partial<EvaluateLotForm>, string]>([
    ['no product', { productId: '' }, 'Elige un producto.'],
    ['no expiry date', { expiresOn: '' }, 'Elige una fecha.'],
    ['text where a number goes', { remainingQuantity: 'mucho' }, 'Escribe un número.'],
    ['a negative usage', { usage7d: '-3' }, 'No puede ser negativo.'],
    ['an empty lot', { initialQuantity: '0' }, 'Tiene que ser mayor que cero.'],
    ['a blank weekly usage', { usage7d: '  ' }, 'Escribe el uso diario.'],
  ])('rejects %s', (_case, change, message) => {
    expect(firstError(change)).toBe(message);
  });

  it('leaves rules between fields to the API', () => {
    expect(firstError({ remainingQuantity: '500', initialQuantity: '48' })).toBeUndefined();
  });
});

describe('form values', () => {
  it('copies a listed lot so that submitting it asks about the same lot', () => {
    const request = evaluateLotSchema.parse(formFromLot(cookiesLot));
    expect(request).toMatchObject({
      initialQuantity: cookiesLot.initialQuantity,
      remainingQuantity: cookiesLot.remainingQuantity,
      usage7d: cookiesLot.usage7d,
      usage28d: cookiesLot.usage28d,
    });
  });

  it('starts empty on the review morning, with nothing ahead in the queue', () => {
    expect(emptyForm('2026-10-04')).toMatchObject({ reviewedOn: '2026-10-04', stockAhead: '0', productId: '' });
  });
});
