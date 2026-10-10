'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDe } from '@/shared/api/api-error';
import { authApi } from '../infrastructure/auth.api';
import { definicionDePerfil, perfilDeRol } from '../domain/perfil';

/**
 * Entrar con una cuenta de Google.
 *
 * ## Por qué es un caso de uso aparte y no una rama de `useLogin`
 *
 * Porque **lo que entra es distinto**: allí un correo y una contraseña que la
 * persona eligió, aquí un `id_token` que emitió Google. Meterlos en la misma
 * mutación obligaría a un tipo unión y a un `if` en el `mutationFn` para
 * decidir a qué endpoint llamar — dos caminos disfrazados de uno.
 *
 * Lo que **sí** comparten es el después, y eso no se duplica: el destino lo
 * decide `perfilDeRol` igual que en el otro, porque en los dos casos manda el
 * rol que devuelve el servidor.
 *
 * Aquí no hay perfil elegido: quien entra por Google no marcó nada en el
 * interruptor, así que el destino sale del rol y de nada más.
 */
export function useLoginConGoogle() {
  const router = useRouter();

  return useMutation({
    mutationFn: (googleToken: string) => authApi.entrarConGoogle(googleToken),

    onSuccess: (datos) => {
      const nombre = datos.usuario.nombreCompleto.split(' ')[0] ?? datos.usuario.nombreCompleto;
      const perfil = perfilDeRol(datos.usuario.rolNombre);

      toast.success(`Hola, ${nombre}`);
      // Sin perfil reconocido se cae a la pantalla de insumos, que es la que
      // todo el mundo puede ver. Adivinar el rol sería peor.
      router.push(perfil ? definicionDePerfil(perfil).entra : '/productos');
      router.refresh();
    },

    onError: (error) => toast.error(mensajeDe(error)),
  });
}
