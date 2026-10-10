'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { usuarioApi } from '../infrastructure/usuario.api';
import { usuarioKeys } from '../infrastructure/personal.keys';
import { nombreCompleto } from '../domain/persona.schema';
import type { CamposDeUsuario } from '../domain/usuario.schema';

/** Alta de cuenta. La contraseña es obligatoria aquí; en la edición no. */
export function useCreateUsuario() {
  return useAccionSobreColeccion({
    ejecutar: (valores: CamposDeUsuario) => usuarioApi.crear(valores),
    invalidar: [usuarioKeys.listas()],
    exito: (usuario) => `${nombreCompleto(usuario.persona)} ya puede entrar`,
  });
}
