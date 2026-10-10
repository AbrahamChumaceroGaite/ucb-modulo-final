'use client';

import { useColeccion } from '@/shared/api/coleccion';
import type { ParamsListado } from '@/shared/api/paginated';
import { clienteApi } from '../infrastructure/cliente.api';
import { clienteKeys } from '../infrastructure/personal.keys';

/** Listado de clientes. Mismo criterio de caché que el de cuentas. */
export function useClienteList(params: ParamsListado, activa = true) {
  return useColeccion(clienteKeys.lista(params), () => clienteApi.listar(params), activa);
}
