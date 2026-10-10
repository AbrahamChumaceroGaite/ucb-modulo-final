import { DomainException, ValueObjectBase } from '@libs/domain';
import type { CatalogProduct } from '../entities/risk-model.entity';
import type { LotReviewInput } from '../services/features';
import { LotDates } from './lot-dates.vo';
import { LotQuantities } from './lot-quantities.vo';
import { RecentUsage } from './recent-usage.vo';

export interface LotReviewData {
  receivedOn: string;
  expiresOn: string;
  reviewedOn: string;
  initialQuantity: number;
  remainingQuantity: number;
  stockAhead: number;
  usage7d: number | null;
  usage28d: number | null;
}

/**
 * One lot on one morning, with every cross-field rule already checked.
 *
 * It is the only way into `RiskModel.predict`: nothing reaches the model that
 * it was not trained to see. A lot read from the database goes through the
 * same rules as one typed in a form.
 */
export class LotReview extends ValueObjectBase<LotReviewInput & { product: CatalogProduct }> {
  private constructor(value: LotReviewInput & { product: CatalogProduct }) {
    super(value);
  }

  static create(product: CatalogProduct, data: LotReviewData): LotReview | DomainException {
    const dates = LotDates.create({ receivedOn: data.receivedOn, expiresOn: data.expiresOn, reviewedOn: data.reviewedOn });
    if (DomainException.isDomainException(dates)) return dates;

    const quantities = LotQuantities.create({
      initial: data.initialQuantity,
      remaining: data.remainingQuantity,
      ahead: data.stockAhead,
    });
    if (DomainException.isDomainException(quantities)) return quantities;

    const usage = RecentUsage.create({ average7d: data.usage7d, average28d: data.usage28d });
    if (DomainException.isDomainException(usage)) return usage;

    return new LotReview({ ...data, family: product.family, product });
  }

  get product(): CatalogProduct {
    return this._value.product;
  }

  /** The raw inputs, exactly as `buildFeatures` expects them. */
  get input(): LotReviewInput {
    const { product: _product, ...input } = this._value;
    return input;
  }
}
