import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type Miga = { etiqueta: string; href?: string };

/**
 * Migas de pan.
 *
 * La última nunca es enlace: es dónde estás, no a dónde puedes ir. Y lleva
 * `aria-current="page"`, que es lo que un lector de pantalla usa para decirlo.
 */
export function Breadcrumbs({ migas, className }: { migas: readonly Miga[]; className?: string }) {
  return (
    <nav aria-label="Ruta de navegación" className={cn('flex items-center gap-1 text-xs', className)}>
      {migas.map((miga, indice) => {
        const ultima = indice === migas.length - 1;

        return (
          <span key={miga.etiqueta} className="flex items-center gap-1">
            {ultima || !miga.href ? (
              <span
                className={cn(ultima ? 'font-medium text-secondary' : 'text-on-surface-variant')}
                aria-current={ultima ? 'page' : undefined}
              >
                {miga.etiqueta}
              </span>
            ) : (
              <Link
                href={miga.href}
                className="text-on-surface-variant transition-colors hover:text-on-surface"
              >
                {miga.etiqueta}
              </Link>
            )}

            {!ultima && (
              <ChevronRight className="size-3 text-on-surface-variant/60" aria-hidden />
            )}
          </span>
        );
      })}
    </nav>
  );
}
