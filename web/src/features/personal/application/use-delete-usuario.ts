'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { usuarioApi } from '../infrastructure/usuario.api';
import { usuarioKeys } from '../infrastructure/personal.keys';

/**
 * Baja de cuenta.
 *
 * Es un borrado lógico: el backend marca `borrado` y la fila sigue ahí. Por
 * eso el aviso dice «ya no puede entrar» y no «se eliminó»: decir que algo se
 * borró cuando sigue en la base es mentirle a quien lo lee.
 */
export function useDeleteUsuario() {
  return useAccionSobreColeccion({
    ejecutar: (id: string) => usuarioApi.eliminar(id),
    invalidar: [usuarioKeys.all],
    exito: () => 'La cuenta ya no puede entrar',
  });
}
