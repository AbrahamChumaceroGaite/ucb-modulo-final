/**
 * `high`: probability ≥ threshold (the model's warning, measured with recall).
 * `watch`: ≥ half the threshold, a reading aid only. `low`: the rest.
 */
export const RISK_LEVELS = ['high', 'watch', 'low'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export function riskLevel(probability: number, threshold: number): RiskLevel {
  if (probability >= threshold) return 'high';
  if (probability >= threshold / 2) return 'watch';
  return 'low';
}
