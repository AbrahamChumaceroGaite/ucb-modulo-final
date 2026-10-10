'use client';

import { useColeccion } from '@/shared/api/coleccion';
import type { ParamsListado } from '@/shared/api/paginated';
import { ventaApi } from '../infrastructure/venta.api';
import { ventaKeys } from '../infrastructure/venta.keys';

/**
 * Listado de ventas.
 *
 * Los parámetros vienen de la URL, así que la clave de caché los incluye: dos
 * filtros distintos son dos entradas distintas y volver atrás no repide nada.
 */
export function useVentaList(params: ParamsListado) {
  return useColeccion(ventaKeys.lista(params), () => ventaApi.listar(params));
}
