'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { ventaApi } from '../infrastructure/venta.api';
import { ventaKeys } from '../infrastructure/venta.keys';

/**
 * Anulación de una venta.
 *
 * Es un borrado lógico: el backend marca `borrado` y la fila sigue ahí. Por
 * eso el aviso dice «anulada» y no «eliminada» — y por eso la venta sigue
 * viéndose en el listado con su estado, que es lo que un arqueo necesita.
 */
export function useDeleteVenta() {
  return useAccionSobreColeccion({
    ejecutar: (id: string) => ventaApi.eliminar(id),
    invalidar: [ventaKeys.all],
    exito: () => 'La venta quedó anulada',
  });
}
