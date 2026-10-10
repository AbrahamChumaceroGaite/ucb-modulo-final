/**
 * Three bands to read a list, one decision.
 *
 * - `high`: probability at or above the operating threshold. This is the
 *   model's decision ("use it first"), the one measured with recall.
 * - `watch`: at least half the threshold. A note, not an alarm.
 * - `low`: the rest.
 *
 * The middle band is a reading aid and takes no part in the evaluation: the
 * reported metrics use only the threshold.
 */
export const RISK_LEVELS = ['high', 'watch', 'low'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export function riskLevel(probability: number, threshold: number): RiskLevel {
  if (probability >= threshold) return 'high';
  if (probability >= threshold / 2) return 'watch';
  return 'low';
}
