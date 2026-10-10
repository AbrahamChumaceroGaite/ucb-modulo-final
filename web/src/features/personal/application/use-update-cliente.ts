'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { clienteApi } from '../infrastructure/cliente.api';
import { clienteKeys } from '../infrastructure/personal.keys';
import { nombreCompleto } from '../domain/persona.schema';
import type { ActualizarCliente } from '../domain/cliente.schema';

/** Edición de cliente. PATCH con solo lo que cambió. */
export function useUpdateCliente() {
  return useAccionSobreColeccion({
    ejecutar: (entrada: { id: string; cambios: ActualizarCliente }) =>
      clienteApi.actualizar(entrada.id, entrada.cambios),
    invalidar: [clienteKeys.all],
    exito: (cliente) => `${nombreCompleto(cliente.persona)} actualizado`,
  });
}
