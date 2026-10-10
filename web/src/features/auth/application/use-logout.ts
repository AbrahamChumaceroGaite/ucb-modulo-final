'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { RUTAS } from '@/shared/config/routes';
import { authApi } from '../infrastructure/auth.api';

/**
 * Cerrar sesión.
 *
 * El backend no tiene endpoint de logout, así que esto solo borra las cookies
 * del lado de Next. Si la llamada fallara, igualmente se navega fuera: dejar a
 * alguien atrapado dentro de la aplicación porque el servidor no contestó es
 * peor que cerrar sin confirmar.
 */
export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.salir(),
    onSettled: () => {
      router.push(RUTAS.landing);
      router.refresh();
    },
  });
}
