'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useClicFuera } from '@/shared/lib/use-overlay';

/**
 * Panel anclado a un disparador. No es modal: el resto de la página sigue viva.
 *
 * Cierra al pulsar fuera y con `Escape`. El disparador declara `aria-expanded`,
 * que es lo que un lector de pantalla necesita para anunciar que hay algo
 * desplegado.
 */
export function Popover({
  disparador,
  children,
  alineacion = 'inicio',
  className,
}: {
  disparador: (props: { abierto: boolean; alternar: () => void }) => ReactNode;
  children: ReactNode | ((props: { cerrar: () => void }) => ReactNode);
  alineacion?: 'inicio' | 'fin' | 'centro';
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  const contenedor = useClicFuera<HTMLDivElement>(abierto, cerrar);

  return (
    <div
      ref={contenedor}
      className="relative inline-flex"
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && abierto) {
          evento.stopPropagation();
          cerrar();
        }
      }}
    >
      {disparador({ abierto, alternar: () => setAbierto((v) => !v) })}

      {abierto && (
        <div
          className={cn(
            'absolute top-[calc(100%+0.5rem)] z-40 min-w-48',
            'rounded-md border border-outline-variant bg-surface-container-high p-1',
            'shadow-[var(--shadow-flotante)]',
            alineacion === 'fin' && 'right-0',
            alineacion === 'inicio' && 'left-0',
            alineacion === 'centro' && 'left-1/2 -translate-x-1/2',
            className,
          )}
        >
          {typeof children === 'function' ? children({ cerrar }) : children}
        </div>
      )}
    </div>
  );
}

/**
 * Entrada de menú dentro de un `<Popover>`.
 *
 * `tono="danger"` para lo destructivo: el color no es decoración, es el aviso
 * de que esa entrada no se deshace.
 */
export function MenuItem({
  icono,
  children,
  onClick,
  tono = 'neutral',
  disabled,
}: {
  icono?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  tono?: 'neutral' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm',
        'transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none',
        tono === 'danger'
          ? 'text-error hover:bg-error/10'
          : 'text-on-surface hover:bg-surface-container-highest',
      )}
    >
      {icono}
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-outline-variant" role="separator" />;
}
