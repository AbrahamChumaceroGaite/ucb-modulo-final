import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Piezas de composición del escaparate.
 *
 * Existen para que ninguna sección escriba su propio encabezado ni su propia
 * cuadrícula: el catálogo es lo primero que se copia, así que si aquí se
 * duplica, se duplicará en todo lo que venga después.
 */
export function Seccion({
  id,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <header className="mb-4 pb-3">
        <h2 className="font-display text-xl font-bold text-on-surface">{titulo}</h2>
        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{descripcion}</p>

        {/* Un trazo que se desvanece por los extremos, no una línea de lado a
            lado. Con `rounded-full` los cabos quedan redondos y el degradado
            evita el corte seco contra el margen. */}
        <span
          className="mt-3 block h-px rounded-full bg-linear-to-r from-outline-variant via-outline-variant to-transparent"
          aria-hidden
        />
      </header>

      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

/** Un ejemplo con su nombre y, si hace falta, la razón de ser de esa variante. */
export function Muestra({
  titulo,
  nota,
  children,
  className,
}: {
  titulo: string;
  nota?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container/50 p-4">
      <div className="mb-3">
        <h3 className="label-caps text-on-surface-variant">{titulo}</h3>
        {nota && <p className="mt-1 text-xs text-on-surface-variant/80">{nota}</p>}
      </div>

      <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
    </div>
  );
}
