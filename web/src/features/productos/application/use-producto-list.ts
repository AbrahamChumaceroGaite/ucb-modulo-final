'use client';

import { useColeccion } from '@/shared/api/coleccion';
import type { ParamsListado } from '@/shared/api/paginated';
import { productoApi } from '../infrastructure/producto.api';
import { productoKeys } from '../infrastructure/producto.keys';

/**
 * Listado de productos.
 *
 * Los parámetros vienen de la URL, así que la clave de caché los incluye: dos
 * filtros distintos son dos entradas distintas y volver atrás no repide nada.
 */
export function useProductoList(params: ParamsListado) {
  return useColeccion(productoKeys.lista(params), () => productoApi.listar(params));
}
