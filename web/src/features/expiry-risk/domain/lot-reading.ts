import { formatPercent, formatQuantity } from '@/shared/lib/format';
import type { Family, LotRisk, ModelCard, RiskLevel } from './lot-risk.schema';

/** `high` is the model's decision; `watch` is a reading aid that takes no part in the metrics. */
export const LEVEL_LABEL: Record<RiskLevel, string> = {
  high: 'Usar primero',
  watch: 'Vigilar',
  low: 'Riesgo bajo',
};

export const FAMILY_LABEL: Record<Family, string> = {
  dairy: 'Lácteos',
  cold_cuts: 'Fiambres',
  bakery: 'Panadería',
  produce: 'Frutas y verduras',
  eggs: 'Huevos',
};

export function decisionSentence(atRisk: boolean): string {
  return atRisk ? 'Conviene usarlo antes que los otros.' : 'Se termina a tiempo.';
}

type Leftover = Pick<LotRisk, 'estimatedLeftover' | 'product'>;

/** What would be left on the expiry day at last week's pace (coverage-rule arithmetic). */
export function leftoverText({ estimatedLeftover, product }: Leftover): string {
  if (estimatedLeftover === null) return 'Sin datos';
  if (estimatedLeftover === 0) return 'Nada';
  return `Unos ${formatQuantity(Math.round(estimatedLeftover), product.unit)}`;
}

/** What the baseline would have done with the same lot. */
export function ruleSentence(coverageRule: boolean | null): string {
  if (coverageRule === null) return 'La regla no tiene consumo para decidir.';
  return coverageRule ? 'La regla también avisa.' : 'La regla no avisa.';
}

/** «De cada 100 avisos, 53 son falsas alarmas.» */
export function falseAlarmsPer100(precision: number): number {
  return Math.round((1 - precision) * 100);
}

/** The limits shown next to the results, with the numbers taken from the model card. */
export function solutionLimits(card: ModelCard): string[] {
  const { model, rule } = card.metrics;
  return [
    `Solo conoce los ${card.products.length} perecederos con los que se entrenó.`,
    `${falseAlarmsPer100(model.precision)} de cada 100 avisos son falsas alarmas. Preferimos eso a perder lotes.`,
    `En aciertos totales gana la regla: ${formatPercent(rule.accuracy)} contra ${formatPercent(model.accuracy)}.`,
    'El sobrante es una cuenta con el consumo de la semana. No lo calcula el modelo.',
    'Con cantidades fuera de lo normal, la probabilidad no sirve.',
    'Trabaja sobre una copia de la base: la lista es de la mañana siguiente al último movimiento.',
  ];
}
