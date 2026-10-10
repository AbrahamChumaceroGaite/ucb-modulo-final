import type { LotReviewData } from '../value_objects/lot-review.vo';

export const OPEN_LOT_REPOSITORY = 'IOpenLotRepository';

/** A lot still open on the review morning, with the raw inputs the model needs. */
export interface OpenLot extends LotReviewData {
  lotId: string;
  productId: string;
}

/**
 * The inventory the risk is computed for.
 *
 * `latestDataDay` is the last day with recorded movements. Reviews happen the
 * morning after it: on a live database that is today, on a snapshot it is the
 * day after the snapshot was taken. Reviewing at the wall-clock date instead
 * would read every day since the snapshot as zero usage.
 */
export interface IOpenLotRepository {
  latestDataDay(): Promise<string | null>;
  findOpen(reviewedOn: string, productIds: readonly string[]): Promise<OpenLot[]>;
}
