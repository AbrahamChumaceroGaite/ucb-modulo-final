'use client';

import { useColeccion } from '@/shared/api/coleccion';
import type { ParamsListado } from '@/shared/api/paginated';
import { usuarioApi } from '../infrastructure/usuario.api';
import { usuarioKeys } from '../infrastructure/personal.keys';

/**
 * Listado de cuentas.
 *
 * Los parámetros vienen de la URL, así que la clave de caché los incluye: dos
 * filtros distintos son dos entradas distintas y volver atrás no repide nada.
 */
export function useUsuarioList(params: ParamsListado, activa = true) {
  return useColeccion(usuarioKeys.lista(params), () => usuarioApi.listar(params), activa);
}
