'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { recetaApi } from '../infrastructure/receta.api';
import { recetaKeys } from '../infrastructure/receta.keys';
import type { ActualizarReceta } from '../domain/receta.schema';

/** Edición de receta. Solo viaja lo que cambió (ver `receta.mapper.ts`). */
export function useUpdateReceta() {
  return useAccionSobreColeccion({
    ejecutar: ({ id, cambios }: { id: string; cambios: ActualizarReceta }) =>
      recetaApi.actualizar(id, cambios),
    invalidar: [recetaKeys.all],
    exito: (receta) => `${receta.titulo} quedó actualizada`,
  });
}
