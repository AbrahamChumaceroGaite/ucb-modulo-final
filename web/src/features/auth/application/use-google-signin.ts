'use client';

import { useGoogleIdentity } from '../infrastructure/google-identity';
import { useLoginConGoogle } from './use-login-google';

/**
 * Entrar con Google, de principio a fin.
 *
 * Junta las dos mitades: la de Google —cargar su script y pedirle que pinte
 * su botón— y la nuestra —mandar el token al BFF y navegar—.
 *
 * Existe porque **la presentación no puede hablar con infraestructura**
 * (regla 3.2), y el botón necesitaba las dos cosas. Con esto la pantalla pide
 * un hueco donde pintar y un estado, que es lo único que le incumbe.
 */
export function useGoogleSignIn() {
  const entrar = useLoginConGoogle();
  const { contenedor, estado } = useGoogleIdentity({
    onCredencial: (googleToken) => entrar.mutate(googleToken),
  });

  return { contenedor, estado, entrando: entrar.isPending };
}
