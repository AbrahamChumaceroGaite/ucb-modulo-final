'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { evaluacionApi } from '../infrastructure/vencimiento.api';
import { evaluacionKeys } from '../infrastructure/vencimiento.keys';

/** Quitar una evaluación de la lista. El lote no se toca: vive en Spring. */
export function useDeleteEvaluacion() {
  return useAccionSobreColeccion({
    ejecutar: (id: string) => evaluacionApi.quitar(id),
    invalidar: [evaluacionKeys.listas()],
    exito: () => 'Evaluación quitada de la lista',
  });
}
