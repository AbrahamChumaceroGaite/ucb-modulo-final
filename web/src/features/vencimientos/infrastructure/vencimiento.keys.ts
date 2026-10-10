import type { ParamsDeEvaluaciones } from '../domain/evaluacion.filtros';

/**
 * Claves de caché de vencimientos.
 *
 * El modelo cuelga aparte de las evaluaciones: registrar o quitar una
 * evaluación invalida las listas, pero no cambia el modelo, y no hay por qué
 * volver a pedir su ficha.
 */
export const evaluacionKeys = {
  all: ['evaluacion-lote'] as const,
  listas: () => [...evaluacionKeys.all, 'lista'] as const,
  lista: (params: ParamsDeEvaluaciones) => [...evaluacionKeys.listas(), params] as const,
};

export const modeloRiesgoKeys = {
  ficha: () => ['modelo-riesgo'] as const,
};
