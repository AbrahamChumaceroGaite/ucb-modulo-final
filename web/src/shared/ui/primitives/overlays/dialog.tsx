'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useOverlay } from '@/shared/lib/use-overlay';
import { IconAction } from '../actions/icon-action';

/**
 * Diálogo modal.
 *
 * Interrumpe: se usa cuando hace falta una decisión o unos datos antes de
 * seguir. Para **ver** algo sin salir del listado va `<Drawer>`, que acompaña
 * en lugar de interrumpir.
 *
 * El foco, el `Escape` y el bloqueo del fondo los aporta `useOverlay`; este
 * componente solo pone la forma.
 *
 * ## El clic fuera no cierra
 *
 * A propósito. Un diálogo se abre para formularios y confirmaciones: cerrarlo
 * por un clic desviado tira lo escrito sin preguntar y sin manera de
 * deshacerlo. Se sale por `Escape`, por la equis o por los botones del pie
 * —tres salidas explícitas—, nunca por accidente.
 *
 * `<Drawer>` sí cierra al pulsar fuera, porque sirve para mirar, no para
 * escribir.
 */
export function Dialog({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md';
}) {
  const panel = useOverlay<HTMLDivElement>(abierto, alCerrar);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Velo sin manejador: apaga el fondo y nada más. Si fuera un botón,
          quien navega con teclado tabularía a un «Cerrar» invisible. */}
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px]" aria-hidden />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden',
          'border border-outline-variant bg-surface-container shadow-[var(--shadow-flotante)]',
          // En móvil sube desde abajo y solo redondea arriba: es el gesto que
          // el sistema operativo ya enseñó.
          'rounded-t-xl sm:rounded-xl',
          ancho === 'sm' ? 'sm:max-w-md' : 'sm:max-w-2xl',
        )}
      >
        <header className="flex items-start gap-3 border-b border-outline-variant px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-on-surface">{titulo}</h2>
            {descripcion && (
              <p className="mt-0.5 text-xs text-on-surface-variant">{descripcion}</p>
            )}
          </div>
          <IconAction
            accion="ver"
            etiqueta="Cerrar"
            icono={<X className="size-4" />}
            onClick={alCerrar}
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {pie && (
          <footer className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-3">
            {pie}
          </footer>
        )}
      </div>
    </div>
  );
}
