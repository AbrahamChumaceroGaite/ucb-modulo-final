/**
 * Three bands for reading the list, one decision.
 *
 * - `alto`: probability at or above the operating threshold. This is the
 *   model's decision ("use it first"), the one measured with Recall.
 * - `vigilar`: at least half the threshold. Not an alarm, a note.
 * - `bajo`: the rest.
 *
 * The middle band is a display aid and is not part of the evaluation: the
 * reported metrics use only the threshold.
 */
export type NivelDeRiesgo = 'alto' | 'vigilar' | 'bajo';

export const NIVELES_DE_RIESGO: readonly NivelDeRiesgo[] = ['alto', 'vigilar', 'bajo'];

export function nivelDeRiesgo(probabilidad: number, umbral: number): NivelDeRiesgo {
  if (probabilidad >= umbral) return 'alto';
  if (probabilidad >= umbral / 2) return 'vigilar';
  return 'bajo';
}
