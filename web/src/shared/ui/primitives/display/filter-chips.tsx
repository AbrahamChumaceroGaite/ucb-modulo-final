'use client';

import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { alternar } from '@/shared/lib/params-lista';

export type OpcionFiltro = { valor: string; etiqueta: string; cuenta?: number };

/**
 * Fila de filtros de **selección múltiple**, con desplazamiento horizontal.
 *
 * ## Por qué múltiple
 *
 * Era de selección única, y eso convertía «enséñame cafés y capuchinos» en
 * dos búsquedas seguidas. Un filtro de categorías que solo admite una
 * categoría no es un filtro: es una navegación.
 *
 * Varios valores del **mismo** grupo se acumulan (unión: cafés *o* masas);
 * grupos **distintos** se cruzan (intersección: activos *y* de la carta). Es
 * lo que espera cualquiera que haya usado una tienda, y está fijado en las
 * pruebas de `*.filtros.ts`.
 *
 * ## La opción vacía es «todos», y limpia
 *
 * La opción con `valor: ''` no es un valor más: al pulsarla se vacía el grupo.
 * Por eso aparece activa justo cuando no hay nada elegido. Sin ella, quitar el
 * último chip obligaría a acordarse de cuál se había puesto.
 *
 * ## Este componente no se desplaza
 *
 * Llegó a tener su propio desplazamiento con flechas, y no servía: quien
 * desbordaba era la fila entera de la barra de filtros, no cada grupo por
 * separado, así que las flechas no aparecían nunca. Eso vive ahora en
 * `<HorizontalScroller>`, que es quien envuelve la fila.
 *
 * Aquí queda un grupo de botones, que es lo que esto es.
 */
export function FilterChips({
  opciones,
  valores,
  onCambiar,
  etiquetaGrupo,
  className,
}: {
  opciones: readonly OpcionFiltro[];
  /** Lo que hay elegido. Vacío es «todos». */
  valores: readonly string[];
  onCambiar: (valores: string[]) => void;
  etiquetaGrupo: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={etiquetaGrupo}
      className={cn('flex shrink-0 flex-nowrap items-center gap-2', className)}
    >
        {opciones.map((opcion) => {
          const esTodos = opcion.valor === '';
          const activo = esTodos ? valores.length === 0 : valores.includes(opcion.valor);

          return (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambiar(esTodos ? [] : alternar(valores, opcion.valor))}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5',
                'text-[0.6875rem] leading-5 font-semibold tracking-wide',
                'transition-colors duration-150',
                activo
                  ? 'border-secondary bg-secondary text-on-secondary'
                  : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-outline hover:text-on-surface',
              )}
            >
              {opcion.etiqueta}
              {opcion.cuenta !== undefined && (
                <span className={cn('tabular-nums', activo ? 'opacity-80' : 'opacity-60')}>
                  {opcion.cuenta}
                </span>
              )}
            </button>
          );
        })}
    </div>
  );
}

/**
 * Chip de filtro aplicado, con su aspa para quitarlo.
 *
 * Aparece cuando un filtro está puesto, para que se vea **qué** está acotando
 * la lista. Un listado filtrado sin señal visible se lee como un listado vacío.
 */
export function AppliedChip({
  etiqueta,
  valor,
  onQuitar,
}: {
  etiqueta: string;
  valor: string;
  onQuitar: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high py-0.5 pl-2 pr-0.5 text-[0.6875rem] leading-4 text-on-surface">
      <span className="text-on-surface-variant">{etiqueta}:</span>
      <span className="font-medium">{valor}</span>
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar filtro ${etiqueta}`}
        className="flex size-4 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error/12 hover:text-error"
      >
        <X className="size-2.5" />
      </button>
    </span>
  );
}
