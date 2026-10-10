'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { productoApi } from '../infrastructure/producto.api';
import { productoKeys } from '../infrastructure/producto.keys';
import type { CrearProducto } from '../domain/producto.schema';

/** Alta de producto. */
export function useCreateProducto() {
  return useAccionSobreColeccion({
    ejecutar: (dto: CrearProducto) => productoApi.crear(dto),
    invalidar: [productoKeys.listas()],
    exito: (producto) => `${producto.nombre} entró a la despensa`,
  });
}
