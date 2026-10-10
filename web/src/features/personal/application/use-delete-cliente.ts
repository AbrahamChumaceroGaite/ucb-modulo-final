'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { clienteApi } from '../infrastructure/cliente.api';
import { clienteKeys } from '../infrastructure/personal.keys';

/** Baja de cliente. Lógica, como todas: la fila se marca, no desaparece. */
export function useDeleteCliente() {
  return useAccionSobreColeccion({
    ejecutar: (id: string) => clienteApi.eliminar(id),
    invalidar: [clienteKeys.all],
    exito: () => 'El cliente salió de la libreta',
  });
}
