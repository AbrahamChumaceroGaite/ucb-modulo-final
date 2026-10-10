'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Ayuda breve al atender un control.
 *
 * Responde al ratón **y al teclado**: `onFocus` y `onBlur` además de los
 * eventos de puntero. Auditamos una librería cuyo tooltip solo escucha el
 * ratón, así que para quien navega con teclado simplemente no existe.
 *
 * Lleva `role="tooltip"` y se enlaza con `aria-describedby`, que es lo que hace
 * que un lector de pantalla lo lea en vez de ignorarlo.
 *
 * No sustituye a una etiqueta: si un icono necesita nombre, eso es
 * `aria-label`, no esto.
 */
export function Tooltip({
  contenido,
  lado = 'arriba',
  children,
}: {
  contenido: string;
  lado?: 'arriba' | 'abajo' | 'izquierda' | 'derecha';
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}

      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-sm px-2 py-1',
            'bg-on-surface text-xs font-medium text-surface',
            'shadow-[var(--shadow-ambient)]',
            lado === 'arriba' && 'bottom-[calc(100%+0.375rem)] left-1/2 -translate-x-1/2',
            lado === 'abajo' && 'top-[calc(100%+0.375rem)] left-1/2 -translate-x-1/2',
            lado === 'izquierda' && 'right-[calc(100%+0.375rem)] top-1/2 -translate-y-1/2',
            lado === 'derecha' && 'left-[calc(100%+0.375rem)] top-1/2 -translate-y-1/2',
          )}
        >
          {contenido}
        </span>
      )}
    </span>
  );
}
