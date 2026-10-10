'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { productoApi } from '../infrastructure/producto.api';
import { productoKeys } from '../infrastructure/producto.keys';

/**
 * Baja de producto.
 *
 * Es un borrado lógico: el backend marca `borrado` y el registro sigue ahí. Por
 * eso el aviso dice «sale de la carta» y no «se eliminó»: decir que algo se
 * borró cuando sigue en la base es mentirle a quien lo lee.
 */
export function useDeleteProducto() {
  return useAccionSobreColeccion({
    ejecutar: (id: string) => productoApi.eliminar(id),
    invalidar: [productoKeys.all],
    exito: () => 'El producto salió de la carta',
  });
}
