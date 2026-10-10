import type { IOpenLotRepository, OpenLot } from '../domain/repositories/IOpenLotRepository.interface';
import type { LotReviewData } from '../domain/value_objects/lot-review.vo';
import { productNamed } from './model-files';

/** In-memory inventory for tests; records which morning and products were requested. */
export class FakeOpenLotRepository implements IOpenLotRepository {
  readonly requests: { reviewedOn: string; productIds: readonly string[] }[] = [];

  constructor(
    private readonly lots: Omit<OpenLot, 'reviewedOn'>[],
    private readonly latest: string | null = '2026-03-03',
  ) {}

  async latestDataDay(): Promise<string | null> {
    return this.latest;
  }

  async findOpen(reviewedOn: string, productIds: readonly string[]): Promise<OpenLot[]> {
    this.requests.push({ reviewedOn, productIds });
    return this.lots.filter((lot) => productIds.includes(lot.productId)).map((lot) => ({ ...lot, reviewedOn }));
  }
}

export function openLot(lotId: string, product: string, data: LotReviewData): Omit<OpenLot, 'reviewedOn'> {
  const { reviewedOn: _reviewedOn, ...rest } = data;
  return { lotId, productId: productNamed(product).productId, ...rest };
}
