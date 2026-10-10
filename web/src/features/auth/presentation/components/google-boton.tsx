'use client';

import { Info } from 'lucide-react';
import { Dots } from '@/shared/ui/primitives';
import { useGoogleSignIn } from '../../application/use-google-signin';

/**
 * «Iniciar sesión con Google».
 *
 * El botón lo dibuja Google dentro del hueco que se le reserva —su aspecto es
 * parte de sus condiciones de uso—, así que aquí solo está el marco, el estado
 * de carga y qué se enseña cuando no se puede.
 *
 * ## Cuando no hay client id no se finge
 *
 * Sin `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no hay forma de pedirle un token a
 * Google. En vez de pintar un botón que al pulsarlo no haría nada —lo que
 * prohíbe la regla 8.14—, se dice qué falta. Es una línea, se lee en dos
 * segundos y ahorra media hora de buscar por qué no pasa nada.
 *
 * ## Lo que este archivo NO hace
 *
 * No carga el script de Google ni llama al BFF: de eso se encarga
 * `useGoogleSignIn`, en la capa de aplicación. La presentación no habla con
 * infraestructura, y esto es una pantalla.
 */
export function GoogleBoton() {
  const { contenedor, estado, entrando } = useGoogleSignIn();

  if (estado === 'sinConfigurar' || estado === 'error') {
    return (
      <p className="flex items-start gap-2 rounded-md border border-dashed border-outline-variant px-3 py-2 text-[0.6875rem] leading-4 text-on-surface-variant">
        <Info className="mt-px size-3.5 shrink-0 text-secondary" aria-hidden />
        {estado === 'sinConfigurar'
          ? 'Entrar con Google necesita NEXT_PUBLIC_GOOGLE_CLIENT_ID; el servidor pide además GOOGLE_CLIENT_ID.'
          : 'No se pudo cargar el acceso con Google. Entra con tu correo.'}
      </p>
    );
  }

  return (
    <div className="flex min-h-10 items-center justify-center">
      {/* El hueco se reserva siempre (`min-h-10`): sin esto, la tarjeta pega
          un salto cuando Google termina de pintar su botón. */}
      {entrando ? (
        <Dots label="Entrando con Google" />
      ) : (
        <>
          <div ref={contenedor} className={estado === 'listo' ? undefined : 'sr-only'} />
          {estado === 'cargando' && <Dots label="Cargando el acceso con Google" />}
        </>
      )}
    </div>
  );
}
