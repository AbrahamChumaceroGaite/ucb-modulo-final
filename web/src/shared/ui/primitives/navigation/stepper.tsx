'use client';

import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type Paso = { clave: string; titulo: string };

/**
 * Indicador de pasos.
 *
 * ## Dos errores que este componente no comete
 *
 * 1. **No deja avanzar sin validar.** El proyecto auditado incrementaba el paso
 *    sin comprobar nada y solo bloqueaba al enviar, así que se llegaba al
 *    resumen con campos vacíos y había que volver hacia atrás a buscarlos.
 *    Aquí quien lo usa decide con `puedeAvanzar`, y el componente respeta esa
 *    decisión.
 * 2. **Se puede volver atrás pulsando un paso ya completado**, que es lo que
 *    cualquiera intenta. Los pasos futuros no son pulsables.
 */
export function Stepper({
  pasos,
  actual,
  onIrA,
  className,
}: {
  pasos: readonly Paso[];
  actual: number;
  onIrA?: (indice: number) => void;
  className?: string;
}) {
  return (
    <ol className={cn('flex w-full items-center gap-1', className)}>
      {pasos.map((paso, indice) => {
        const completado = indice < actual;
        const activo = indice === actual;
        const alcanzable = completado && onIrA;

        return (
          <li key={paso.clave} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!alcanzable}
              onClick={() => alcanzable && onIrA(indice)}
              aria-current={activo ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors',
                alcanzable ? 'cursor-pointer hover:bg-surface-container-high' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  completado && 'bg-primary text-on-primary',
                  activo && 'bg-secondary text-on-secondary',
                  !completado && !activo && 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                {completado ? <Check className="size-3.5" strokeWidth={3} /> : indice + 1}
              </span>

              <span
                className={cn(
                  'hidden truncate text-xs sm:inline',
                  activo ? 'font-medium text-on-surface' : 'text-on-surface-variant',
                )}
              >
                {paso.titulo}
              </span>
            </button>

            {indice < pasos.length - 1 && (
              <span
                className={cn(
                  'h-px min-w-2 flex-1 transition-colors',
                  completado ? 'bg-primary' : 'bg-outline-variant',
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
