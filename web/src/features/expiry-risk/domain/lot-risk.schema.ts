import { z } from 'zod';

/** Same lists as the API (`domain/services/features.ts` and `risk-level.vo.ts`). */
export const RISK_LEVELS = ['high', 'watch', 'low'] as const;
export const FAMILIES = ['dairy', 'cold_cuts', 'bakery', 'produce', 'eggs'] as const;

const isoDate = z.iso.date();

/** One lot scored by the model: an item of `GET /lot-risk` and the answer of `POST /lot-risk/evaluate`. */
export const lotRiskSchema = z.object({
  /** `null` for a lot typed by hand. */
  lotId: z.string().nullable(),
  product: z.object({ id: z.string(), name: z.string(), family: z.enum(FAMILIES), unit: z.string() }),
  receivedOn: isoDate,
  expiresOn: isoDate,
  reviewedOn: isoDate,
  daysToExpiry: z.number().int(),
  initialQuantity: z.number(),
  remainingQuantity: z.number(),
  stockAhead: z.number(),
  usage7d: z.number().nullable(),
  usage28d: z.number().nullable(),
  probability: z.number().min(0).max(1),
  threshold: z.number(),
  atRisk: z.boolean(),
  level: z.enum(RISK_LEVELS),
  /** What the baseline says; `null` without last week's usage. */
  coverageRule: z.boolean().nullable(),
  coverageDays: z.number().nullable(),
  /** Arithmetic of the coverage rule, not a model output. */
  estimatedLeftover: z.number().nullable(),
  modelVersion: z.string(),
});

export const lotRiskPageSchema = z.object({
  data: z.array(lotRiskSchema),
  skip: z.number(),
  limit: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
  /** The morning the list was computed for; `null` when the database has no movements. */
  reviewedOn: isoDate.nullable(),
});

const metricsSchema = z.object({
  recall: z.number(),
  precision: z.number(),
  accuracy: z.number(),
  f1: z.number(),
  earlyWarning2Days: z.number(),
});

const partitionSchema = z.object({
  rows: z.number(),
  lots: z.number(),
  positiveShare: z.number(),
  from: isoDate,
  to: isoDate,
});

/** `GET /risk-model`: what the model knows and how it did on the test set against the baseline. */
export const modelCardSchema = z.object({
  version: z.string(),
  trainedAt: z.string(),
  threshold: z.number(),
  targetRecall: z.number(),
  products: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      family: z.enum(FAMILIES),
      unit: z.string(),
      medianShelfLifeDays: z.number(),
    }),
  ),
  metrics: z.object({ model: metricsSchema, rule: metricsSchema }),
  partitions: z.object({ train: partitionSchema, validation: partitionSchema, test: partitionSchema }),
});

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type Family = (typeof FAMILIES)[number];
export type LotRisk = z.infer<typeof lotRiskSchema>;
export type LotRiskPage = z.infer<typeof lotRiskPageSchema>;
export type ModelCard = z.infer<typeof modelCardSchema>;
export type ModelMetrics = z.infer<typeof metricsSchema>;
export type CatalogProduct = ModelCard['products'][number];
