import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { TRAMOS, type Tramo } from './form-layout.data';

/**
 * Disposición de formularios por filas y tramos.
 *
 * ## Por qué no una rejilla de 12 columnas
 *
 * Una rejilla fija obliga a cada pantalla a repetir `grid-cols-2 md:grid-cols-4`
 * y a inventar sus propios puntos de corte. Aquí cada campo declara **cuánto
 * ocupa** y la fila se reordena sola: los campos envuelven cuando no caben, sin
 * un solo breakpoint escrito en la pantalla.
 *
 * ```tsx
 * <FormRow>
 *   <FormField tramo="mitad">…</FormField>
 *   <FormField tramo="mitad">…</FormField>
 * </FormRow>
 * <FormRow>
 *   <FormField tramo="completo">…</FormField>
 * </FormRow>
 * ```
 */
export function FormLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>;
}

/** Una fila. Los campos que no caben bajan solos. */
export function FormRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap gap-4', className)}>{children}</div>;
}

/**
 * Un tramo dentro de la fila.
 *
 * El ancho se declara con `flex-basis` y un mínimo en píxeles: por debajo de
 * ese mínimo el campo ocupa la fila entera. Así un campo de un cuarto no se
 * estruja hasta ser inservible en una pantalla estrecha.
 */
export function FormField({
  tramo = 'completo',
  minimo = '12rem',
  children,
  className,
}: {
  tramo?: Tramo;
  minimo?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('min-w-0 grow', className)}
      style={{ flexBasis: `max(${minimo}, calc(${TRAMOS[tramo]} - 1rem))` }}
    >
      {children}
    </div>
  );
}

/*
  Aquí hubo un `FormSection`: un separador con título para formularios largos.
  Se fue cuando los formularios pasaron a ser por pasos —`<FormWizard>`—, porque
  el paso ya **es** la sección y con su propio rótulo en el indicador. Dejarlo
  habría sido mantener dos formas de agrupar campos compitiendo en el mismo
  sistema. Lo detectó `audit-muertos` en cuanto se quedó sin consumidores.
*/

/** Pie de acciones. A la derecha, con la principal al final. */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2 pt-1', className)}>
      {children}
    </div>
  );
}
