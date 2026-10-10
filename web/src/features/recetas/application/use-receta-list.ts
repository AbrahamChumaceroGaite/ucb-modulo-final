'use client';

import { useColeccion } from '@/shared/api/coleccion';
import type { ParamsListado } from '@/shared/api/paginated';
import { recetaApi } from '../infrastructure/receta.api';
import { recetaKeys } from '../infrastructure/receta.keys';

/**
 * Listado de recetas.
 *
 * Los parámetros vienen de la URL, así que la clave de caché los incluye: dos
 * filtros distintos son dos entradas distintas y volver atrás no repide nada.
 */
export function useRecetaList(params: ParamsListado) {
  return useColeccion(recetaKeys.lista(params), () => recetaApi.listar(params));
}
