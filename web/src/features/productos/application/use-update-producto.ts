'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { productoApi } from '../infrastructure/producto.api';
import { productoKeys } from '../infrastructure/producto.keys';
import type { ActualizarProducto } from '../domain/producto.schema';

/**
 * Edición de producto. PATCH con solo lo que cambió.
 *
 * Invalida la rama entera —lista y detalle—: quien tenga el panel abierto ve
 * el valor que el servidor confirmó, no el que se escribió.
 */
export function useUpdateProducto() {
  return useAccionSobreColeccion({
    ejecutar: (entrada: { id: string; cambios: ActualizarProducto }) =>
      productoApi.actualizar(entrada.id, entrada.cambios),
    invalidar: [productoKeys.all],
    exito: (producto) => `${producto.nombre} actualizado`,
  });
}
