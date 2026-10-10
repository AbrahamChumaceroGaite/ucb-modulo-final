import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MODEL_DIR, testConfig } from '@libs/testing/test-config';
import type { CatalogProduct, RiskModel } from '../domain/entities/risk-model.entity';
import type { LotReviewInput } from '../domain/services/features';
import type { LotReviewData } from '../domain/value_objects/lot-review.vo';
import { RiskModelFileRepository } from '../infrastructure/model/risk-model.file.repository';

/** Test fixtures read from `model/`: tests use the real trained model. */
export function readModelFile<T>(file: string): T {
  return JSON.parse(readFileSync(join(MODEL_DIR, file), 'utf8')) as T;
}

let cached: RiskModel | undefined;

export function realRiskModel(): RiskModel {
  cached ??= new RiskModelFileRepository(testConfig()).get();
  return cached;
}

/** A catalog product by name (quantities are in its own unit). */
export function productNamed(name: string): CatalogProduct {
  const product = realRiskModel().card.products.find((item) => item.name === name);
  if (!product) throw new Error(`No product named ${name} in the model`);
  return product;
}

/** One row of `parity.json`: Python's inputs, features and probability (NaN written as `null`). */
export interface ParityRow {
  input: {
    family: string;
    received_on: string;
    expires_on: string;
    reviewed_on: string;
    initial_quantity: number;
    remaining_quantity: number;
    stock_ahead: number;
    usage_7d: number | null;
    usage_28d: number | null;
  };
  features: (number | null)[];
  probability: number;
  rule: 0 | 1;
}

export const parityRows = readModelFile<ParityRow[]>('parity.json');

export function toInput({ input }: ParityRow): LotReviewInput {
  return {
    family: input.family,
    receivedOn: input.received_on,
    expiresOn: input.expires_on,
    reviewedOn: input.reviewed_on,
    initialQuantity: input.initial_quantity,
    remainingQuantity: input.remaining_quantity,
    stockAhead: input.stock_ahead,
    usage7d: input.usage_7d,
    usage28d: input.usage_28d,
  };
}

export const pythonFeatures = (row: ParityRow): number[] => row.features.map((value) => value ?? Number.NaN);

/** A kilo of tomatoes behind another kilo, at 100 g a day, with 6 usable days left. */
export const SLOW_TOMATOES: LotReviewData = {
  receivedOn: '2026-03-02',
  expiresOn: '2026-03-09',
  reviewedOn: '2026-03-04',
  initialQuantity: 1000,
  remainingQuantity: 900,
  stockAhead: 1000,
  usage7d: 100,
  usage28d: 150,
};

/** Three litres of milk at the front of the queue, used at 3.2 L a day, 12 days to go. */
export const BUSY_MILK: LotReviewData = {
  receivedOn: '2026-03-02',
  expiresOn: '2026-03-16',
  reviewedOn: '2026-03-04',
  initialQuantity: 8000,
  remainingQuantity: 3000,
  stockAhead: 0,
  usage7d: 3200,
  usage28d: 3200,
};
