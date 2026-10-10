'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { TEXTO_POR_NIVEL } from '../domain/evaluacion.lectura';
import type { RegistrarEvaluacion } from '../domain/evaluacion.schema';
import { evaluacionApi } from '../infrastructure/vencimiento.api';
import { evaluacionKeys } from '../infrastructure/vencimiento.keys';

/**
 * Evaluar un lote: el servicio corre el modelo y devuelve su respuesta.
 *
 * El aviso dice lo que contestó el modelo, no «guardado»: es lo que la persona
 * vino a saber.
 */
export function useCreateEvaluacion() {
  return useAccionSobreColeccion({
    ejecutar: (valores: RegistrarEvaluacion) => evaluacionApi.registrar(valores),
    invalidar: [evaluacionKeys.listas()],
    exito: (evaluacion) => `${evaluacion.insumo}: ${TEXTO_POR_NIVEL[evaluacion.nivel].toLowerCase()}`,
  });
}
