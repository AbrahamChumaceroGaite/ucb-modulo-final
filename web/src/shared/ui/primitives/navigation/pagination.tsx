'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { IconAction } from '../actions/icon-action';
import { LIMITES_PAGINA, paginaDe, totalPaginasDe } from '@/shared/api/paginated';

/**
 * Paginador. **Uno solo** para toda la aplicación: lo usa la tabla y lo usa la
 * rejilla de tarjetas.
 *
 * Auditamos un proyecto con cuatro copias byte a byte idénticas del paginador
 * —marcado y cálculos— porque cada listado se hizo el suyo.
 *
 * No guarda estado: recibe `skip` y `limit` y emite la intención. Quien manda
 * es la URL.
 */
export function Pagination({
  skip,
  limit,
  total,
  onCambiar,
  className,
}: {
  skip: number;
  limit: number;
  total: number;
  onCambiar: (siguiente: { skip: number; limit: number }) => void;
  className?: string;
}) {
  const pagina = paginaDe(skip, limit);
  const paginas = totalPaginasDe(total, limit);
  const desde = total === 0 ? 0 : skip + 1;
  const hasta = Math.min(skip + limit, total);

  const irA = (nuevaPagina: number) => {
    const destino = Math.min(Math.max(1, nuevaPagina), paginas);
    onCambiar({ skip: (destino - 1) * limit, limit });
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-1 py-3',
        className,
      )}
    >
      <p className="text-xs text-on-surface-variant" data-tabular>
        {total === 0 ? 'Sin resultados' : `${desde}–${hasta} de ${total}`}
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="hidden sm:inline">Por página</span>
          <select
            value={limit}
            onChange={(evento) => onCambiar({ skip: 0, limit: Number(evento.target.value) })}
            className="h-8 rounded-sm border border-outline-variant bg-surface-container-lowest px-2 text-xs text-on-surface outline-none transition-colors hover:border-outline focus:border-secondary"
            aria-label="Registros por página"
          >
            {LIMITES_PAGINA.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-0.5">
          <IconAction
            accion="ver"
            etiqueta="Primera página"
            icono={<ChevronsLeft className="size-4" />}
            disabled={pagina <= 1}
            onClick={() => irA(1)}
          />
          <IconAction
            accion="ver"
            etiqueta="Página anterior"
            icono={<ChevronLeft className="size-4" />}
            disabled={pagina <= 1}
            onClick={() => irA(pagina - 1)}
          />

          <span
            className="min-w-16 text-center text-xs font-medium text-on-surface"
            aria-live="polite"
            data-tabular
          >
            {pagina} / {paginas}
          </span>

          <IconAction
            accion="ver"
            etiqueta="Página siguiente"
            icono={<ChevronRight className="size-4" />}
            disabled={pagina >= paginas}
            onClick={() => irA(pagina + 1)}
          />
          <IconAction
            accion="ver"
            etiqueta="Última página"
            icono={<ChevronsRight className="size-4" />}
            disabled={pagina >= paginas}
            onClick={() => irA(paginas)}
          />
        </div>
      </div>
    </div>
  );
}
