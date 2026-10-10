'use client';

import { useColeccion } from '@/shared/api/coleccion';
import type { ParamsDeEvaluaciones } from '../domain/evaluacion.filtros';
import { evaluacionApi } from '../infrastructure/vencimiento.api';
import { evaluacionKeys } from '../infrastructure/vencimiento.keys';

/** Las evaluaciones, ya filtradas y paginadas por el servicio. */
export function useEvaluacionList(params: ParamsDeEvaluaciones) {
  return useColeccion(evaluacionKeys.lista(params), () => evaluacionApi.listar(params));
}
