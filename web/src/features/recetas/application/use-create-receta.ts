'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { recetaApi } from '../infrastructure/receta.api';
import { recetaKeys } from '../infrastructure/receta.keys';
import type { CrearReceta } from '../domain/receta.schema';

/** Alta de receta. */
export function useCreateReceta() {
  return useAccionSobreColeccion({
    ejecutar: (dto: CrearReceta) => recetaApi.crear(dto),
    invalidar: [recetaKeys.listas()],
    exito: (receta) => `${receta.titulo} ya está en el recetario`,
  });
}
