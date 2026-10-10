'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDe } from '@/shared/api/api-error';
import { authApi } from '../infrastructure/auth.api';
import { definicionDePerfil, perfilDeRol } from '../domain/perfil';
import type { Acceso } from '../domain/sesion.schema';

/**
 * Iniciar sesión.
 *
 * `router.refresh()` además de `push`: el layout del panel es un Server
 * Component que lee la cookie, y sin refrescar seguiría sirviendo la versión
 * que se renderizó cuando no había sesión.
 *
 * ## Quién decide el destino
 *
 * El perfil elegido en el formulario dice adónde **quiere** ir alguien. El rol
 * que devuelve el servidor dice quién **es**. Cuando el servidor se pronuncia,
 * gana el servidor: mandar a un operador a la pantalla de cuentas porque marcó
 * la casilla equivocada es enseñarle una puerta cerrada.
 */
export function useLogin() {
  const router = useRouter();

  return useMutation({
    // El perfil se queda aquí: a Spring solo le van correo y contraseña.
    mutationFn: ({ perfil: _perfil, ...credenciales }: Acceso) => authApi.entrar(credenciales),

    onSuccess: (datos, enviado) => {
      const nombre = datos.usuario.nombreCompleto.split(' ')[0] ?? datos.usuario.nombreCompleto;
      const real = perfilDeRol(datos.usuario.rolNombre);
      const destino = definicionDePerfil(real ?? enviado.perfil).entra;

      // Un solo aviso. Dos seguidos —saludo y advertencia— se pisan en la
      // esquina y el segundo no se lee.
      if (real && real !== enviado.perfil) {
        toast.warning(`Hola, ${nombre}`, {
          description: `Entraste como ${datos.usuario.rolNombre}, no como ${definicionDePerfil(enviado.perfil).etiqueta.toLowerCase()}. Te llevamos a lo tuyo.`,
        });
      } else {
        toast.success(`Hola, ${nombre}`);
      }

      router.push(destino);
      router.refresh();
    },

    onError: (error) => toast.error(mensajeDe(error)),
  });
}
