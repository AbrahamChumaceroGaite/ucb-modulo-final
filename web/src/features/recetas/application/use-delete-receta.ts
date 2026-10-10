'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { recetaApi } from '../infrastructure/receta.api';
import { recetaKeys } from '../infrastructure/receta.keys';

/**
 * Baja de receta.
 *
 * Es un borrado lógico: el backend marca `borrado` y el registro sigue ahí. Por
 * eso el aviso dice «sale del recetario» y no «se eliminó»: decir que algo se
 * borró cuando sigue en la base es mentirle a quien lo lee.
 */
export function useDeleteReceta() {
  return useAccionSobreColeccion({
    ejecutar: (id: string) => recetaApi.eliminar(id),
    invalidar: [recetaKeys.all],
    exito: () => 'La receta salió del recetario',
  });
}
