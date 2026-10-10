'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Comportamiento común de todo lo que se abre por encima de la página:
 * diálogos, paneles laterales y menús.
 *
 * Son cuatro obligaciones que un overlay accesible tiene que cumplir, y si cada
 * componente las reimplementa, alguna se olvida. Auditamos una librería cuyo
 * tooltip solo escucha eventos de ratón y queda fuera del alcance del teclado.
 *
 * 1. `Escape` cierra.
 * 2. El foco entra al abrir y **vuelve a donde estaba** al cerrar.
 * 3. El tabulador no se escapa del overlay mientras está abierto.
 * 4. El fondo no se desplaza detrás.
 */
export function useOverlay<T extends HTMLElement>(
  abierto: boolean,
  alCerrar: () => void,
  opciones: { atraparFoco?: boolean; bloquearScroll?: boolean } = {},
): RefObject<T | null> {
  const { atraparFoco = true, bloquearScroll = true } = opciones;
  const contenedor = useRef<T>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    focoPrevio.current = document.activeElement as HTMLElement | null;

    const nodo = contenedor.current;
    if (nodo) {
      const primero = nodo.querySelector<HTMLElement>(SELECTOR_ENFOCABLE);
      (primero ?? nodo).focus({ preventScroll: true });
    }

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        alCerrar();
        return;
      }

      if (evento.key !== 'Tab' || !atraparFoco || !contenedor.current) return;

      const enfocables = [...contenedor.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE)];
      if (enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (!primero || !ultimo) return;

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alPulsar);

    const overflowPrevio = document.body.style.overflow;
    if (bloquearScroll) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPulsar);
      if (bloquearScroll) document.body.style.overflow = overflowPrevio;
      // El foco vuelve a quien abrió: sin esto, quien navega con teclado
      // aparece al principio de la página tras cerrar.
      focoPrevio.current?.focus({ preventScroll: true });
    };
  }, [abierto, alCerrar, atraparFoco, bloquearScroll]);

  return contenedor;
}

/**
 * Cierra al pulsar fuera del elemento.
 *
 * Va aparte de `useOverlay` porque un menú ancla lo necesita y un diálogo modal
 * no: el diálogo ya tiene un velo que recoge el clic.
 */
export function useClicFuera<T extends HTMLElement>(
  activo: boolean,
  alCerrar: () => void,
): RefObject<T | null> {
  const referencia = useRef<T>(null);

  useEffect(() => {
    if (!activo) return;

    const alPulsar = (evento: MouseEvent) => {
      if (referencia.current && !referencia.current.contains(evento.target as Node)) {
        alCerrar();
      }
    };

    // `pointerdown` y no `click`: si se escucha el clic, el mismo que abre el
    // menú lo cierra en el siguiente ciclo.
    document.addEventListener('pointerdown', alPulsar);
    return () => document.removeEventListener('pointerdown', alPulsar);
  }, [activo, alCerrar]);

  return referencia;
}

const SELECTOR_ENFOCABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
