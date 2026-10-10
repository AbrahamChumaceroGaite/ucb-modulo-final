import { DomainException } from '@libs/domain';
import { productNamed } from '../../testing/model-files';
import { LotReview, type LotReviewData } from './lot-review.vo';

const milk = productNamed('Leche Pil 1 L');

const valid: LotReviewData = {
  receivedOn: '2026-03-02',
  expiresOn: '2026-03-12',
  reviewedOn: '2026-03-05',
  initialQuantity: 12000,
  remainingQuantity: 6000,
  stockAhead: 2000,
  usage7d: 1000,
  usage28d: 800,
};

function rejection(change: Partial<LotReviewData>): DomainException {
  const result = LotReview.create(milk, { ...valid, ...change });
  if (!DomainException.isDomainException(result)) throw new Error('expected a rejection');
  return result;
}

describe('LotReview', () => {
  it('takes the family from the catalog, not from the caller', () => {
    const review = LotReview.create(milk, valid);
    expect(review).toBeInstanceOf(LotReview);
    expect((review as LotReview).input).toEqual({ ...valid, family: 'dairy' });
  });

  it('accepts a product with no usage history yet', () => {
    expect(LotReview.create(milk, { ...valid, usage7d: null, usage28d: null })).toBeInstanceOf(LotReview);
  });

  it.each<[string, Partial<LotReviewData>, number, string]>([
    ['a malformed date', { receivedOn: '02/03/2026' }, 400, 'AAAA-MM-DD'],
    ['a date that does not exist', { expiresOn: '2026-02-30' }, 400, 'AAAA-MM-DD'],
    ['expiry on or before receipt', { expiresOn: '2026-03-02' }, 422, 'posterior a la de ingreso'],
    ['a review before receipt', { reviewedOn: '2026-03-01' }, 422, 'antes de que entre'],
    ['a review after expiry', { reviewedOn: '2026-03-13' }, 422, 'ya venció'],
    ['an empty lot', { initialQuantity: 0 }, 400, 'mayor que cero'],
    ['nothing left', { remainingQuantity: 0 }, 422, 'no le queda nada'],
    ['more left than received', { remainingQuantity: 12001 }, 422, 'más de lo que tenía'],
    ['negative stock ahead', { stockAhead: -1 }, 400, 'negativo'],
    ['negative weekly usage', { usage7d: -0.5 }, 400, '7 días'],
    ['NaN monthly usage', { usage28d: Number.NaN }, 400, '28 días'],
  ])('rejects %s', (_case, change, status, message) => {
    const error = rejection(change);
    expect(error.status).toBe(status);
    expect(error.message).toContain(message);
  });

  it('accepts a review on the expiry day itself', () => {
    expect(LotReview.create(milk, { ...valid, reviewedOn: '2026-03-12' })).toBeInstanceOf(LotReview);
  });
});
