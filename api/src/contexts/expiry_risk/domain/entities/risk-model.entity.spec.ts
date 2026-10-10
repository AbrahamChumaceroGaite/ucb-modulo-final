import { DomainException } from '@libs/domain';
import { BUSY_MILK, parityRows, productNamed, realRiskModel, SLOW_TOMATOES } from '../../testing/model-files';
import { LotReview, type LotReviewData } from '../value_objects/lot-review.vo';
import type { Prediction } from './risk-model.entity';

const model = realRiskModel();

function review(product: string, data: LotReviewData): LotReview {
  const result = LotReview.create(productNamed(product), data);
  if (DomainException.isDomainException(result)) throw result;
  return result;
}

function predict(product: string, data: LotReviewData): Prediction {
  const result = model.predict(review(product, data));
  if (DomainException.isDomainException(result)) throw result;
  return result;
}

describe('RiskModel', () => {
  it('returns the probability Python returned for the same lot', () => {
    const row = parityRows.find((item) => item.input.usage_7d !== null)!;
    const { input } = row;
    const product = model.card.products.find((item) => item.family === input.family)!;
    const prediction = predict(product.name, {
      receivedOn: input.received_on,
      expiresOn: input.expires_on,
      reviewedOn: input.reviewed_on,
      initialQuantity: input.initial_quantity,
      remainingQuantity: input.remaining_quantity,
      stockAhead: input.stock_ahead,
      usage7d: input.usage_7d,
      usage28d: input.usage_28d,
    });
    expect(Math.abs(prediction.probability - row.probability)).toBeLessThan(1e-12);
  });

  it('decides with the threshold chosen on validation, not 0.5', () => {
    const prediction = predict('Tomate 1 kg', SLOW_TOMATOES);
    expect(prediction.threshold).toBe(model.card.threshold);
    expect(prediction.threshold).toBeLessThan(0.5);
    expect(prediction.atRisk).toBe(prediction.probability >= prediction.threshold);
    expect(prediction.modelVersion).toBe(model.card.version);
  });

  it('flags a lot that will not be used in time and clears one that will', () => {
    const slow = predict('Tomate 1 kg', SLOW_TOMATOES);
    expect(slow.level).toBe('high');
    expect(slow.coverageRule).toBe(true);

    const busy = predict('Leche Pil 1 L', BUSY_MILK);
    expect(busy.level).toBe('low');
    expect(busy.coverageRule).toBe(false);
  });

  it('moves the probability the way usage moves it', () => {
    const faster = predict('Tomate 1 kg', { ...SLOW_TOMATOES, stockAhead: 0, usage7d: 300, usage28d: 250 });
    expect(faster.probability).toBeLessThan(predict('Tomate 1 kg', SLOW_TOMATOES).probability);
  });

  it('estimates the leftover with the same arithmetic as the coverage rule', () => {
    // 1900 g in the queue minus 6 days × 100 g = 1300 g, capped at the 900 g this lot holds.
    expect(predict('Tomate 1 kg', SLOW_TOMATOES).estimatedLeftover).toBe(900);
    // 1900 − 6 × 250 = 400 g.
    expect(predict('Tomate 1 kg', { ...SLOW_TOMATOES, usage7d: 250 }).estimatedLeftover).toBe(400);
    expect(predict('Tomate 1 kg', { ...SLOW_TOMATOES, usage7d: null, usage28d: null }).estimatedLeftover).toBeNull();
  });

  it('refuses dates the holiday calendar does not cover', () => {
    const late = review('Tomate 1 kg', { ...SLOW_TOMATOES, receivedOn: '2030-12-28', reviewedOn: '2030-12-29', expiresOn: '2031-01-03' });
    const result = model.predict(late);
    expect(DomainException.isDomainException(result) && result.status).toBe(422);
  });

  it('knows exactly the products it was trained on', () => {
    expect(model.productIds).toHaveLength(model.card.products.length);
    expect(model.product('00000000-0000-0000-0000-000000000000')).toBeUndefined();
  });
});
