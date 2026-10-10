import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { TONO_CLASES, type Tone } from '@/shared/config/variants';

/**
 * Etiqueta de estado. Tenue por defecto, sólida cuando tiene que destacar.
 *
 * El tono sale de `variants.ts` y de ningún otro sitio: no se admite un
 * `variant="critical"` inventado aquí.
 *
 * Es deliberadamente diminuta: una etiqueta acompaña a un dato, no compite con
 * él. Cuando tenía el tamaño de un botón pequeño, una rejilla de tarjetas se
 * leía como una rejilla de botones.
 */
export function Tag({
  tono = 'neutral',
  solido = false,
  icono,
  children,
  className,
}: {
  tono?: Tone;
  solido?: boolean;
  icono?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const clases = TONO_CLASES[tono];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-px text-[0.6875rem] leading-4 font-medium',
        '[&>svg]:size-3',
        solido ? clases.solido : cn(clases.fondo, clases.texto),
        className,
      )}
    >
      {icono}
      {children}
    </span>
  );
}

/**
 * Punto de estado para tablas densas.
 *
 * En una tabla de 40 px de alto una etiqueta entera roba ancho a los datos. Un
 * punto con su texto al lado dice lo mismo ocupando la mitad.
 */
export function StatusDot({
  tono = 'neutral',
  children,
  className,
}: {
  tono?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', TONO_CLASES[tono].solido)} aria-hidden />
      <span className="text-on-surface-variant">{children}</span>
    </span>
  );
}

/**
 * Etiqueta de categoría: mayúsculas, semibold y tracking amplio.
 *
 * Es parte de la firma visual del producto; por eso es un componente y no una
 * clase suelta que cada tarjeta escriba a su manera.
 */
export function CategoryLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('label-caps text-on-surface-variant', className)}>{children}</span>;
}
