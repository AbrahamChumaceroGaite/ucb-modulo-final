'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { usuarioApi } from '../infrastructure/usuario.api';
import { usuarioKeys } from '../infrastructure/personal.keys';
import { nombreCompleto } from '../domain/persona.schema';
import type { ActualizarUsuario } from '../domain/usuario.schema';

/**
 * Edición de cuenta. PATCH con solo lo que cambió.
 *
 * Invalida la rama entera —lista y detalle—: quien tenga el panel abierto ve
 * el valor que el servidor confirmó, no el que se escribió.
 */
export function useUpdateUsuario() {
  return useAccionSobreColeccion({
    ejecutar: (entrada: { id: string; cambios: ActualizarUsuario }) =>
      usuarioApi.actualizar(entrada.id, entrada.cambios),
    invalidar: [usuarioKeys.all],
    exito: (usuario) => `${nombreCompleto(usuario.persona)} actualizado`,
  });
}
