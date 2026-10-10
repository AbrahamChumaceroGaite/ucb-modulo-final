import type { LotReviewData } from '../value_objects/lot-review.vo';

export const OPEN_LOT_REPOSITORY = 'IOpenLotRepository';

/** A lot still open on the review morning, with the raw inputs the model needs. */
export interface OpenLot extends LotReviewData {
  lotId: string;
  productId: string;
}

/**
 * Open lots read from the inventory. They are reviewed the morning after
 * `latestDataDay`: today on a live database, the day after a snapshot.
 */
export interface IOpenLotRepository {
  latestDataDay(): Promise<string | null>;
  findOpen(reviewedOn: string, productIds: readonly string[]): Promise<OpenLot[]>;
}
