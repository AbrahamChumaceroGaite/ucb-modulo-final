'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * El botón oficial de Google, encapsulado en un hook.
 *
 * ## Por qué el botón lo pinta Google y no nosotros
 *
 * Porque su aspecto es parte de las condiciones de uso de «Iniciar sesión con
 * Google»: color, logotipo, texto y tamaños están especificados. Un botón
 * propio que lo imite se sale de la marca del sistema **y** de las suyas.
 * Aquí se le reserva el hueco y se le deja pintar dentro.
 *
 * ## Por qué hace falta un client id en el navegador
 *
 * El `id_token` lo emite Google en el cliente y el backend solo lo verifica.
 * Sin `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no hay forma de pedirlo, así que el hook
 * responde `disponible: false` y la pantalla enseña el motivo en lugar de un
 * botón que no puede funcionar.
 *
 * Es el mismo client id que el backend espera en `GOOGLE_CLIENT_ID`: si no
 * coinciden, Google emite un token para otra aplicación y Spring responde
 * `401 El token de Google no es valido`.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const FUENTE = 'https://accounts.google.com/gsi/client';

type Credencial = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (respuesta: Credencial) => void;
      }) => void;
      renderButton: (
        contenedor: HTMLElement,
        opciones: Record<string, string | number>,
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/** Carga el script una sola vez, aunque el hook se monte en varios sitios. */
let cargando: Promise<void> | null = null;

function cargarScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  cargando ??= new Promise<void>((resolver, rechazar) => {
    const etiqueta = document.createElement('script');
    etiqueta.src = FUENTE;
    etiqueta.async = true;
    etiqueta.onload = () => resolver();
    etiqueta.onerror = () => rechazar(new Error('No se pudo cargar el script de Google'));
    document.head.append(etiqueta);
  });

  return cargando;
}

export function useGoogleIdentity({
  onCredencial,
}: {
  onCredencial: (googleToken: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'sinConfigurar' | 'error'>(
    CLIENT_ID ? 'cargando' : 'sinConfigurar',
  );

  // La referencia evita volver a inicializar Google cada vez que el
  // componente se re-renderiza con un manejador nuevo. Se actualiza en un
  // efecto y no durante el render: escribir una ref mientras se renderiza es
  // un efecto secundario encubierto.
  const manejador = useRef(onCredencial);
  useEffect(() => {
    manejador.current = onCredencial;
  });

  useEffect(() => {
    if (!CLIENT_ID) return;

    let vivo = true;

    void cargarScript()
      .then(() => {
        if (!vivo || !contenedor.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (respuesta) => {
            if (respuesta.credential) manejador.current(respuesta.credential);
          },
        });

        // El tema se lee del DOM aquí y no llega por props: vive en un
        // atributo de `<html>` que solo existe en el navegador, y Google lo
        // necesita **al construir** el botón. Guardarlo en un estado de React
        // solo servía para provocar un render de más.
        const oscuro = document.documentElement.dataset['tema'] === 'oscuro';

        window.google.accounts.id.renderButton(contenedor.current, {
          type: 'standard',
          theme: oscuro ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: 320,
        });

        setEstado('listo');
      })
      .catch(() => {
        if (vivo) setEstado('error');
      });

    return () => {
      vivo = false;
    };
  }, []);

  return { contenedor, estado };
}
