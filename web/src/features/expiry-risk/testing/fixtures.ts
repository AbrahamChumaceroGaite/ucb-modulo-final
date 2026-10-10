import type { LotRisk, LotRiskPage, ModelCard } from '../domain/lot-risk.schema';

/**
 * API answers copied verbatim from `GET /lot-risk` and `GET /risk-model` on the
 * restored database (morning of 4 Oct 2026). Only tests import this file.
 */
const base = { reviewedOn: '2026-10-04', threshold: 0.140225317324589, modelVersion: '2.0.0' };

/** Model and coverage rule agree: use it first. */
export const cookiesLot: LotRisk = {
  ...base,
  lotId: 'a67b8d05-f3c0-40a1-a2b9-a9a656f5ab02',
  product: { id: '8e432348-4d75-410a-9f54-847a57dcc74f', name: 'Galletas de mantequilla', family: 'bakery', unit: 'und' },
  receivedOn: '2026-10-01',
  expiresOn: '2026-10-08',
  daysToExpiry: 4,
  initialQuantity: 48,
  remainingQuantity: 48,
  stockAhead: 2,
  usage7d: 8.4286,
  usage28d: 8.2857,
  probability: 0.7007554703764584,
  atRisk: true,
  level: 'high',
  coverageRule: true,
  coverageDays: 5.932183280734642,
  estimatedLeftover: 7.856999999999999,
};

/** The hard case: the model warns and the coverage rule does not. */
export const tomatoLot: LotRisk = {
  ...base,
  lotId: '6a70af44-0d3a-494e-b556-eceeddf55359',
  product: { id: 'fa57601c-8e6f-4779-8468-bdc04b2c4f6e', name: 'Tomate 1 kg', family: 'produce', unit: 'g' },
  receivedOn: '2026-09-28',
  expiresOn: '2026-10-06',
  daysToExpiry: 2,
  initialQuantity: 1000,
  remainingQuantity: 400,
  stockAhead: 0,
  usage7d: 142.8571,
  usage28d: 187.5,
  probability: 0.309842059122805,
  atRisk: true,
  level: 'high',
  coverageRule: false,
  coverageDays: 2.800000840000252,
  estimatedLeftover: 0,
};

export const milkLot: LotRisk = {
  ...base,
  lotId: 'd824cf67-ff69-40cc-a0cc-928984fe72ab',
  product: { id: '7018661a-6043-418a-9fe4-88d5ea08c753', name: 'Leche Pil 1 L', family: 'dairy', unit: 'ml' },
  receivedOn: '2026-10-02',
  expiresOn: '2026-10-12',
  daysToExpiry: 8,
  initialQuantity: 8000,
  remainingQuantity: 8000,
  stockAhead: 0,
  usage7d: 4548.4286,
  usage28d: 4123.9286,
  probability: 0.00037764977082933046,
  atRisk: false,
  level: 'low',
  coverageRule: false,
  coverageDays: 1.7588491990398618,
  estimatedLeftover: 0,
};

export function pageOf(lots: LotRisk[], total = lots.length, skip = 0): LotRiskPage {
  return { data: lots, skip, limit: 10, total, hasMore: skip + lots.length < total, reviewedOn: '2026-10-04' };
}

function catalogEntry({ product }: LotRisk) {
  return { productId: product.id, name: product.name, family: product.family, unit: product.unit };
}

// Test metrics rounded to four decimals; the product list is cut to the three lots above.
const testMetrics = {
  recall: 0.8733,
  precision: 0.4723,
  accuracy: 0.8841,
  f1: 0.6131,
  earlyWarning2Days: 0.9434,
};
const ruleMetrics = {
  recall: 0.6614,
  precision: 0.5339,
  accuracy: 0.9037,
  f1: 0.5909,
  earlyWarning2Days: 0.7736,
};

export const modelCard: ModelCard = {
  version: '2.0.0',
  trainedAt: '2026-10-10T15:40:42+00:00',
  threshold: 0.140225317324589,
  targetRecall: 0.85,
  products: [
    { ...catalogEntry(cookiesLot), medianShelfLifeDays: 7 },
    { ...catalogEntry(tomatoLot), medianShelfLifeDays: 7 },
    { ...catalogEntry(milkLot), medianShelfLifeDays: 9 },
  ],
  metrics: { model: testMetrics, rule: ruleMetrics },
  partitions: {
    train: { rows: 17285, lots: 3308, positiveShare: 0.1939, from: '2021-10-01', to: '2024-06-30' },
    validation: { rows: 6335, lots: 1272, positiveShare: 0.1138, from: '2024-07-29', to: '2025-06-30' },
    test: { rows: 7811, lots: 1590, positiveShare: 0.1051, from: '2025-07-29', to: '2026-09-30' },
  },
};
