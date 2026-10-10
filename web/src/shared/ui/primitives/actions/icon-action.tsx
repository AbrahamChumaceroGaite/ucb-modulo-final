'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { ACENTOS, type AccionIcono } from './icon-action.data';

interface IconActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Qué hace. Decide el color que toma al atenderlo. */
  accion: AccionIcono;
  /** Obligatorio: un icono sin nombre no existe para un lector de pantalla. */
  etiqueta: string;
  icono: ReactNode;
}

/**
 * Acción de fila o de tarjeta: un icono redondo que toma color al atenderlo.
 *
 * ## Por qué el color solo aparece al pasar el cursor
 *
 * Una fila con tres botones de colores permanentes parece un semáforo. En
 * reposo son todos neutros; el color aparece cuando el puntero llega, y
 * entonces sí distingue: ver es informativo, editar es la marca, eliminar
 * avisa de lo que hace.
 *
 * ## Táctil
 *
 * En pantallas sin puntero no existe «pasar el cursor», así que allí el color
 * se muestra siempre y el objetivo crece a 44 px. Ocultar el color en táctil
 * dejaría la distinción inalcanzable.
 */
export const IconAction = forwardRef<HTMLButtonElement, IconActionProps>(function IconAction(
  { accion, etiqueta, icono, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'size-8 [@media(hover:none)]:size-11',
        'text-on-surface-variant transition-colors duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        ACENTOS[accion],
        className,
      )}
      {...props}
    >
      {icono}
    </button>
  );
});

/**
 * Grupo de acciones. Aparecen al atender la tarjeta o la fila que las contiene,
 * y permanecen visibles en táctil.
 *
 * El contenedor reserva su espacio siempre (`opacity`, no `display`), así que
 * la fila no cambia de alto cuando las acciones aparecen.
 */
export function IconActionGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 transition-opacity duration-150',
        'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
        '[@media(hover:none)]:opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
}
