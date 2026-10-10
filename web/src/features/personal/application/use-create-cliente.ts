'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { clienteApi } from '../infrastructure/cliente.api';
import { clienteKeys } from '../infrastructure/personal.keys';
import { nombreCompleto } from '../domain/persona.schema';
import type { CamposDeCliente } from '../domain/cliente.schema';

/** Alta de cliente. Sin correo, sin contraseña y sin rol: solo la persona. */
export function useCreateCliente() {
  return useAccionSobreColeccion({
    ejecutar: (valores: CamposDeCliente) => clienteApi.crear(valores),
    invalidar: [clienteKeys.listas()],
    exito: (cliente) => `${nombreCompleto(cliente.persona)} está en la libreta`,
  });
}
