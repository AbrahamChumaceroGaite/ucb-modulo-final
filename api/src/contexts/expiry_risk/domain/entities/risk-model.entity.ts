import { DomainException } from '@libs/domain';
import { buildFeatures, coverageDays, coverageRule, type Family } from '../services/features';
import { dayNumber, isoDate } from '../services/iso-date';
import type { LightGbmForest } from '../services/lightgbm-forest';
import type { OperatingCalendar } from '../services/operating-calendar';
import type { LotReview } from '../value_objects/lot-review.vo';
import { riskLevel, type RiskLevel } from '../value_objects/risk-level.vo';

/** A product the model was trained on, as `training/src/export.py` writes it. */
export interface CatalogProduct {
  productId: string;
  name: string;
  family: Family;
  unit: string;
  medianShelfLifeDays: number;
}

/** Test-set results of the model and of the baseline. */
export interface TestMetrics {
  recall: number;
  precision: number;
  accuracy: number;
  f1: number;
  prAuc?: number | null;
  earlyWarning2Days: number;
}

export interface PartitionSize {
  rows: number;
  lots: number;
  positiveShare: number;
  from: string;
  to: string;
}

export interface ModelCard {
  version: string;
  trainedAt: string;
  threshold: number;
  targetRecall: number;
  products: CatalogProduct[];
  metrics: { model: TestMetrics; rule: TestMetrics };
  partitions: Record<'train' | 'validation' | 'test', PartitionSize>;
}

export interface Prediction {
  probability: number;
  threshold: number;
  atRisk: boolean;
  level: RiskLevel;
  coverageRule: boolean | null;
  coverageDays: number | null;
  estimatedLeftover: number | null;
  modelVersion: string;
}

/**
 * The trained model as the domain sees it: what it knows (products and
 * calendar) and what it decides (probability against a threshold).
 *
 * Loaded once by infrastructure and immutable. Nothing is trained or adjusted
 * at runtime: the API only reuses what `training/src/train.py` produced.
 */
export class RiskModel {
  private readonly products: ReadonlyMap<string, CatalogProduct>;

  constructor(
    public readonly card: ModelCard,
    private readonly forest: LightGbmForest,
    private readonly calendar: OperatingCalendar,
  ) {
    this.products = new Map(card.products.map((product) => [product.productId, product]));
  }

  product(productId: string): CatalogProduct | undefined {
    return this.products.get(productId);
  }

  get productIds(): string[] {
    return [...this.products.keys()];
  }

  predict(review: LotReview): Prediction | DomainException {
    const input = review.input;
    // The features look one week back and up to the expiry date. Outside the
    // loaded calendar, "is it a class day" has no answer.
    const weekBefore = isoDate(dayNumber(input.reviewedOn) - 7);
    if (!this.calendar.covers(weekBefore) || !this.calendar.covers(input.expiresOn)) {
      return DomainException.unprocessable(
        `El calendario de feriados cubre de ${this.calendar.firstYear} a ${this.calendar.lastYear}; estas fechas quedan fuera.`,
      );
    }

    const features = buildFeatures(input, this.calendar);
    const probability = this.forest.probability(features);
    const threshold = this.card.threshold;

    return {
      probability,
      threshold,
      atRisk: probability >= threshold,
      level: riskLevel(probability, threshold),
      coverageRule: coverageRule(features),
      coverageDays: coverageDays(features),
      estimatedLeftover: estimatedLeftover(review),
      modelVersion: this.card.version,
    };
  }
}

/**
 * How much of this lot would be left on its expiry day at the recent pace.
 *
 * The arithmetic behind the coverage rule, shown so the person reads a
 * quantity ("about 2 L would be left") and not only a percentage. It is not
 * the model's output, and the screen says so.
 */
function estimatedLeftover(review: LotReview): number | null {
  const { usage7d, stockAhead, remainingQuantity, expiresOn, reviewedOn } = review.input;
  if (usage7d === null) return null;
  const usedUntilExpiry = usage7d * (dayNumber(expiresOn) - dayNumber(reviewedOn) + 1);
  const left = stockAhead + remainingQuantity - usedUntilExpiry;
  return Math.max(0, Math.min(remainingQuantity, left));
}
