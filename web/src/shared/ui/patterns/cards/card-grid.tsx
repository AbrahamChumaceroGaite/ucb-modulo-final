import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { ANCHO_MINIMO, type Vista } from './view';

/**
 * La colocación de una colección de tarjetas.
 *
 * Reduce columnas sola por espacio disponible (`auto-fill` + `minmax`), sin un
 * solo breakpoint. Eso no es una comodidad: una rejilla con puntos de corte
 * fijos mide **la ventana**, no el hueco en el que está, así que se rompe en
 * cuanto alguien la mete dentro de un panel o de un diálogo.
 *
 * | Vista | Qué hace |
 * |---|---|
 * | `rejilla` | Columnas de 17rem mínimo. La de siempre |
 * | `compacta` | Columnas de 12rem mínimo: caben casi el doble |
 * | `lista` | Una sola columna; las tarjetas se ponen de lado |
 *
 * `tabla` no pasa por aquí: esa vista no son tarjetas, es `<DataTable>`, y la
 * pantalla decide cuál de las dos monta.
 */
export function CardGrid({
  children,
  vista = 'rejilla',
  className,
}: {
  children: ReactNode;
  vista?: Vista;
  className?: string;
}) {
  if (vista === 'lista') {
    return <div className={cn('flex flex-col gap-2', className)}>{children}</div>;
  }

  const minimo = vista === 'compacta' ? ANCHO_MINIMO.compacta : ANCHO_MINIMO.rejilla;

  return (
    <div
      className={cn('grid gap-3', className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${minimo}, 100%), 1fr))` }}
    >
      {children}
    </div>
  );
}
