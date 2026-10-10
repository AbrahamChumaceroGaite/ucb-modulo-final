import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Hueco cuando no hay nada que mostrar.
 *
 * **Uno solo para toda la aplicación.** Auditamos un proyecto con cinco copias
 * de esta lógica, y con textos distintos para el mismo estado: «Dados de baja»
 * en dos pantallas y «Desactivados» en otras dos.
 *
 * El componente no decide el texto. Distinguir «todavía no hay productos» de
 * «no hay resultados para *espresso*» es una decisión de la pantalla, que es
 * quien sabe si hay un filtro puesto.
 */
export function EmptyState({
  icono,
  titulo,
  mensaje,
  accion,
  className,
}: {
  icono?: ReactNode;
  titulo: string;
  mensaje?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-12 text-center',
        'border border-dashed border-outline-variant bg-surface-container/40',
        className,
      )}
    >
      {icono && (
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          {icono}
        </span>
      )}

      <div className="max-w-sm">
        <p className="text-sm font-medium text-on-surface">{titulo}</p>
        {mensaje && <p className="mt-1 text-xs text-on-surface-variant">{mensaje}</p>}
      </div>

      {accion}
    </div>
  );
}
