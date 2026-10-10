'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { ventaApi } from '../infrastructure/venta.api';
import { ventaKeys } from '../infrastructure/venta.keys';
import type { ActualizarVenta } from '../domain/venta.schema';

/** Corrección de una venta. Solo viaja lo que cambió (ver `venta.mapper.ts`). */
export function useUpdateVenta() {
  return useAccionSobreColeccion({
    ejecutar: ({ id, cambios }: { id: string; cambios: ActualizarVenta }) =>
      ventaApi.actualizar(id, cambios),
    invalidar: [ventaKeys.all],
    exito: () => 'La venta quedó corregida',
  });
}
