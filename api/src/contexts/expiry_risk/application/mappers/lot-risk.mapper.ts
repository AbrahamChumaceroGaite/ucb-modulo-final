import type { Prediction } from '../../domain/entities/risk-model.entity';
import { dayNumber } from '../../domain/services/iso-date';
import type { LotReview } from '../../domain/value_objects/lot-review.vo';
import type { LotRiskResponse } from '../types/lot-risk.types';

export function toLotRiskResponse(review: LotReview, prediction: Prediction, lotId: string | null): LotRiskResponse {
  const { product } = review;
  const input = review.input;
  return {
    lotId,
    product: { id: product.productId, name: product.name, family: product.family, unit: product.unit },
    receivedOn: input.receivedOn,
    expiresOn: input.expiresOn,
    reviewedOn: input.reviewedOn,
    daysToExpiry: dayNumber(input.expiresOn) - dayNumber(input.reviewedOn),
    initialQuantity: input.initialQuantity,
    remainingQuantity: input.remainingQuantity,
    stockAhead: input.stockAhead,
    usage7d: input.usage7d,
    usage28d: input.usage28d,
    ...prediction,
  };
}
