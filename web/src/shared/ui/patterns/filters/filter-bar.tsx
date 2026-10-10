'use client';

import { useState, type ReactNode } from 'react';
import { FilterX, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ANCHO_FILTROS_EN_LINEA, useMediaQuery } from '@/shared/lib/use-media-query';
import { Button } from '../../primitives/actions/button';
import { AppliedChip } from '../../primitives/display/filter-chips';
import { Drawer } from '../../primitives/overlays/drawer';
import { HorizontalScroller } from '../../primitives/display/horizontal-scroller';

export type FiltroAplicado = {
  /** Único en la fila. Con filtros de varios valores, es `grupo:valor`. */
  clave: string;
  etiqueta: string;
  valor: string;
  /** Cómo se deshace **este** chip. Lo sabe quien lo creó, no la barra. */
  quitar: () => void;
};

/**
 * Los chips de «filtrando por» de un filtro de varios valores: uno por valor.
 *
 * Existe porque las dos pantallas de lista hacían lo mismo con las mismas
 * cuatro líneas, y porque con selección múltiple el chip ya no puede quitarse
 * «por clave»: quitar «Cafés» de `categoria=cafes,masas` es reescribir la
 * lista sin ese valor, no borrar el parámetro.
 *
 * Por eso cada chip trae su propio `quitar`. La alternativa era que la barra
 * recibiera `onQuitar(clave)` y que cada pantalla reconstruyera el valor a
 * partir de una clave compuesta partiendo cadenas — un `split(':')` en la
 * vista, que se rompe el día que un id lleve dos puntos.
 */
export function chipsDeLista({
  clave,
  etiqueta,
  valores,
  texto,
  alCambiar,
}: {
  clave: string;
  etiqueta: string;
  valores: readonly string[];
  /** Cómo se lee ese valor para una persona: el nombre, no el UUID. */
  texto: (valor: string) => string;
  alCambiar: (valores: string[]) => void;
}): FiltroAplicado[] {
  return valores.map((valor) => ({
    clave: `${clave}:${valor}`,
    etiqueta,
    valor: texto(valor),
    quitar: () => alCambiar(valores.filter((otro) => otro !== valor)),
  }));
}

/**
 * La barra de filtros de un listado: lo que acota, lo que está acotando y
 * cómo se mira.
 *
 * ## Tres filas, y cada una responde a una pregunta distinta
 *
 * 1. **Qué puedo acotar** — los chips de categoría y el intervalo de fechas,
 *    que llegan por `children` porque cada pantalla filtra por lo suyo.
 * 2. **Qué está acotando ahora** — los chips aplicados, cada uno con su aspa.
 *    Un listado filtrado sin señal visible se lee como un listado vacío: es el
 *    fallo que más veces vimos en la auditoría, y el que más soporte genera.
 * 3. **Cómo lo miro** — el alternador de vistas, a la derecha del todo.
 *
 * ## En ancho, una sola fila que se desplaza
 *
 * Los grupos **no se envuelven en varias líneas**: van en una fila que se
 * desplaza, con flechas cuando hay más de lo que cabe
 * (`<HorizontalScroller>`). Envolviéndolos, cuatro grupos ocupaban tres
 * renglones y empujaban la lista fuera de la pantalla.
 *
 * ## En estrecho, los filtros se van a una hoja
 *
 * Por debajo de `md` tres grupos de chips se apilan en cinco líneas y comen
 * media pantalla antes de enseñar un solo registro. Ahí se convierten en un
 * botón **«Filtros»** con el número de los que hay puestos, y al pulsarlo se
 * abre la **misma hoja que usa `<Drawer>`** — la que sube desde abajo, con su
 * tirador.
 *
 * Es el mismo `children`, montado en un sitio o en otro: no hay una segunda
 * versión de los filtros que mantener. Y no hay un overlay nuevo: la hoja ya
 * existía.
 *
 * ## Por qué «Limpiar» solo aparece cuando hay algo que limpiar
 *
 * Un botón permanente que casi siempre no hace nada enseña a ignorarlo. Aquí
 * la fila de aplicados y el botón nacen juntos y desaparecen juntos.
 *
 * La barra **no guarda estado de filtrado**. Recibe lo aplicado y emite
 * intenciones; quien decide es la pantalla, que es quien escribe en la URL.
 * Lo único suyo es si la hoja está abierta, que no le importa a nadie más.
 */
export function FilterBar({
  children,
  aplicados,
  onLimpiar,
  vista,
  className,
}: {
  /** Los controles de filtrado propios de la pantalla: chips, fechas, etc. */
  children: ReactNode;
  aplicados: readonly FiltroAplicado[];
  onLimpiar: () => void;
  /** El alternador de vistas. Va aquí porque es parte de «cómo miro la lista». */
  vista?: ReactNode;
  className?: string;
}) {
  const enLinea = useMediaQuery(ANCHO_FILTROS_EN_LINEA);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const hayFiltros = aplicados.length > 0;

  return (
    <section
      aria-label="Filtros del listado"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container/60 p-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {enLinea ? (
          <HorizontalScroller etiqueta="Filtros disponibles">{children}</HorizontalScroller>
        ) : (
          <Button
            tono="contorno"
            icono={<SlidersHorizontal className="size-4" />}
            onClick={() => setHojaAbierta(true)}
            className="flex-1"
          >
            Filtros
            {hayFiltros && (
              <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[0.625rem] font-semibold text-on-primary">
                {aplicados.length}
              </span>
            )}
          </Button>
        )}

        {vista && <div className="shrink-0">{vista}</div>}
      </div>

      {hayFiltros && (
        <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/60 pt-3">
          <span className="label-caps text-on-surface-variant">Filtrando por</span>

          {aplicados.map((filtro) => (
            <AppliedChip
              key={filtro.clave}
              etiqueta={filtro.etiqueta}
              valor={filtro.valor}
              onQuitar={filtro.quitar}
            />
          ))}

          <Button
            tono="fantasma"
            icono={<FilterX className="size-3.5" />}
            onClick={onLimpiar}
            className="ml-auto"
          >
            Limpiar
          </Button>
        </div>
      )}

      {/* La hoja solo se monta en estrecho. Montarla siempre y esconderla con
          CSS dejaría un diálogo vivo bloqueando el desplazamiento: ya nos pasó
          con el panel que empuja. */}
      {!enLinea && (
        <Drawer
          abierto={hojaAbierta}
          alCerrar={() => setHojaAbierta(false)}
          titulo="Filtros"
          subtitulo={hayFiltros ? `${aplicados.length} puesto(s)` : 'Ninguno puesto'}
          marca={<SlidersHorizontal />}
          pie={
            <>
              {hayFiltros && (
                <Button tono="contorno" onClick={onLimpiar}>
                  Limpiar
                </Button>
              )}
              <Button tono="primary" onClick={() => setHojaAbierta(false)}>
                Ver resultados
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">{children}</div>
        </Drawer>
      )}
    </section>
  );
}
