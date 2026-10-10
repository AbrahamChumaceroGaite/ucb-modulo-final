'use client';

import { useRef, useState, type PointerEvent as PointerEventoReact, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useOverlay } from '@/shared/lib/use-overlay';
import { ANCHO_PARA_EMPUJAR, useMediaQuery } from '@/shared/lib/use-media-query';
import { IconAction } from '../actions/icon-action';

/**
 * Panel lateral de detalle. Hay dos, y la diferencia no es estética.
 *
 * - **`<Drawer>` se superpone.** Vela el fondo y lo desenfoca: el listado deja
 *   de estar disponible mientras el panel está abierto. Sirve para mirar un
 *   registro a fondo.
 * - **`<DrawerPush>` empuja.** El contenido se estrecha y el panel se sienta a
 *   su lado, sin velo. Los dos siguen vivos, así que sirve para comparar el
 *   panel con la lista: filtros, ayuda contextual, una ficha mientras se
 *   recorre la tabla.
 *
 * Ambos redondean sus esquinas interiores, como cualquier otra superficie del
 * sistema. Un panel a escuadra contra el borde de la pantalla es lo único que
 * quedaría cuadrado en todo Kaffehaus.
 *
 * ## En móvil no es un panel lateral: es una hoja
 *
 * Un panel de 30rem en una pantalla de 375 px no es un panel, es un diálogo
 * mal puesto. Ahí sube desde abajo, ocupa el ancho entero, curva solo sus
 * esquinas de arriba y lleva el **tirador** —la rayita— que el sistema
 * operativo ya enseñó a arrastrar. Y se arrastra de verdad: bajarlo 80 px lo
 * cierra.
 *
 * El tirador no es la única salida: `Escape`, la equis y el velo siguen ahí.
 * Un gesto que no tiene equivalente pulsable deja fuera a quien no puede
 * hacerlo.
 */
export function Drawer({
  abierto,
  alCerrar,
  titulo,
  subtitulo,
  marca,
  children,
  pie,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  subtitulo?: string;
  /** Icono grande de la cabecera: identifica el tipo de registro sin texto. */
  marca?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const panel = useOverlay<HTMLDivElement>(abierto, alCerrar);
  const { arrastre, manejadores } = useArrastreDeHoja(alCerrar);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch">
      {/* Aquí el clic fuera **sí** cierra: este panel es para mirar, no para
          escribir, así que no hay nada que perder por accidente. */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={alCerrar}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px]"
      />

      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        style={arrastre > 0 ? { transform: `translateY(${arrastre}px)` } : undefined}
        className={cn(
          'relative flex w-full flex-col overflow-hidden bg-surface-container',
          'border border-outline-variant shadow-[var(--shadow-flotante)]',
          // Móvil: hoja que sube desde abajo.
          'max-h-[85vh] rounded-t-xl border-b-0',
          'animate-[kh-hoja-sube_260ms_var(--ease-suave)]',
          // Escritorio: panel lateral de alto completo.
          'sm:h-full sm:max-h-none sm:max-w-[30rem] sm:rounded-t-none sm:rounded-l-xl sm:border-b',
          'sm:animate-[kh-panel-entra_260ms_var(--ease-suave)]',
          // Mientras se arrastra no hay transición: la hoja tiene que seguir
          // al dedo, no ir detrás de él.
          arrastre === 0 && 'transition-transform duration-200 ease-[var(--ease-suave)]',
        )}
      >
        <Tirador {...manejadores} />

        <CabeceraPanel titulo={titulo} subtitulo={subtitulo} marca={marca} alCerrar={alCerrar} />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {pie && (
          <footer className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
            {pie}
          </footer>
        )}
      </aside>
    </div>
  );
}

/**
 * Panel que empuja en vez de taparlo.
 *
 * Envuelve el contenido de la pantalla porque tiene que estrecharlo: esa es
 * toda la diferencia con `<Drawer>`, y es la razón de que reciba `children`
 * —la página— y `panel` —el detalle— por separado.
 *
 * ## Por debajo de `lg` no empuja
 *
 * Empujar reparte el ancho entre dos cosas, y en un teléfono eso deja dos
 * columnas inservibles. Ahí el panel pasa a ser la misma hoja que sube desde
 * abajo que usa `<Drawer>`, con su tirador. No es una excepción escondida: es
 * la única forma que el espacio permite.
 *
 * **La decisión se toma en JavaScript, no con `lg:hidden`.** Durante una
 * versión se montaban los dos y se escondía uno con CSS: la hoja invisible
 * seguía ejecutándose, bloqueaba el desplazamiento de la página entera y se
 * llevaba el foco del teclado a un botón «Cerrar» que nadie podía ver. Se
 * midió: `body.style.overflow` en `hidden` y `document.activeElement` dentro
 * del diálogo oculto. Ocultar no es desmontar.
 */
export function DrawerPush({
  abierto,
  alCerrar,
  titulo,
  subtitulo,
  marca,
  panel,
  pie,
  children,
  className,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  subtitulo?: string;
  marca?: ReactNode;
  /** El detalle que se sienta al lado. */
  panel: ReactNode;
  pie?: ReactNode;
  /** El contenido de la pantalla, que es lo que se estrecha. */
  children: ReactNode;
  className?: string;
}) {
  const hayAnchoParaEmpujar = useMediaQuery(ANCHO_PARA_EMPUJAR);

  if (!hayAnchoParaEmpujar) {
    return (
      <div className={className}>
        {children}

        {/* Estrecho: no hay sitio para empujar, así que sube desde abajo. */}
        <Drawer
          abierto={abierto}
          alCerrar={alCerrar}
          titulo={titulo}
          {...(subtitulo ? { subtitulo } : {})}
          {...(marca ? { marca } : {})}
          {...(pie ? { pie } : {})}
        >
          {panel}
        </Drawer>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-4', className)}>
      <div className="min-w-0 flex-1">{children}</div>

      {/* El panel es un hermano que ocupa su ancho. La transición va en
          `width` y no en `transform` justamente porque el objetivo es que el
          vecino se entere y se recoloque.

          ## Por qué es `sticky` y de alto fijo

          Antes medía lo que midiera su contenido y se iba con el
          desplazamiento: con una lista larga, bajar tres filas dejaba la ficha
          fuera de la pantalla, que es justo lo contrario de para qué sirve
          este panel —mirar el detalle **mientras** se recorre la lista—.

          Ahora se queda pegado bajo la cabecera y ocupa el alto que hay,
          descontando la barra de arriba y el menú flotante de abajo. Lo que
          desborda se desplaza **dentro** del panel. */}
      <aside
        aria-hidden={!abierto}
        className={cn(
          'sticky top-[calc(var(--spacing-cabecera)+1rem)] shrink-0 self-start overflow-hidden',
          'transition-[width,opacity] duration-300 ease-[var(--ease-suave)]',
          abierto ? 'w-[22rem] opacity-100' : 'w-0 opacity-0',
        )}
      >
        <div
          className={cn(
            'flex w-[22rem] flex-col overflow-hidden rounded-xl',
            'border border-outline-variant bg-surface-container',
            'h-[calc(100dvh-var(--spacing-cabecera)-var(--spacing-menu-flotante)-2rem)]',
          )}
        >
          <CabeceraPanel titulo={titulo} subtitulo={subtitulo} marca={marca} alCerrar={alCerrar} />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{panel}</div>

          {pie && (
            <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant px-5 py-3">
              {pie}
            </footer>
          )}
        </div>
      </aside>
    </div>
  );
}

/**
 * El tirador de la hoja: la rayita de arriba.
 *
 * Solo existe en móvil, porque solo allí la superficie es una hoja. Es un
 * `<div>` y no un botón a propósito: **no hace nada al pulsarlo**, solo se
 * arrastra, y un botón que no responde al Enter sería una promesa falsa. Las
 * salidas pulsables son la equis, el velo y `Escape`.
 */
function Tirador(manejadores: {
  onPointerDown: (evento: PointerEventoReact<HTMLDivElement>) => void;
  onPointerMove: (evento: PointerEventoReact<HTMLDivElement>) => void;
  onPointerUp: (evento: PointerEventoReact<HTMLDivElement>) => void;
}) {
  return (
    <div
      {...manejadores}
      aria-hidden
      className="flex shrink-0 cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing sm:hidden"
    >
      <span className="h-1 w-9 rounded-full bg-outline-variant" />
    </div>
  );
}

const CIERRA_A_PARTIR_DE = 80;

/**
 * Arrastrar la hoja hacia abajo para cerrarla.
 *
 * Con eventos de puntero y no de toque: los mismos manejadores valen para
 * dedo, ratón y lápiz, y `setPointerCapture` mantiene el seguimiento aunque el
 * dedo se salga del tirador.
 *
 * Solo hacia abajo (`Math.max(0, …)`): tirar hacia arriba no significa nada
 * aquí y despegaría la hoja del borde.
 */
function useArrastreDeHoja(alCerrar: () => void) {
  const inicio = useRef<number | null>(null);
  const [arrastre, setArrastre] = useState(0);

  return {
    arrastre,
    manejadores: {
      onPointerDown: (evento: PointerEventoReact<HTMLDivElement>) => {
        inicio.current = evento.clientY;
        evento.currentTarget.setPointerCapture(evento.pointerId);
      },
      onPointerMove: (evento: PointerEventoReact<HTMLDivElement>) => {
        if (inicio.current === null) return;
        setArrastre(Math.max(0, evento.clientY - inicio.current));
      },
      onPointerUp: (evento: PointerEventoReact<HTMLDivElement>) => {
        evento.currentTarget.releasePointerCapture(evento.pointerId);
        const recorrido = arrastre;
        inicio.current = null;
        setArrastre(0);
        if (recorrido > CIERRA_A_PARTIR_DE) alCerrar();
      },
    },
  };
}

/** Cabecera común a los dos paneles. Escrita una vez, no dos. */
function CabeceraPanel({
  titulo,
  subtitulo,
  marca,
  alCerrar,
}: {
  titulo: string;
  subtitulo?: string;
  marca?: ReactNode;
  alCerrar: () => void;
}) {
  return (
    <header className="relative shrink-0 overflow-hidden border-b border-outline-variant bg-surface-container-high px-5 py-4">
      {/* La marca de fondo, girada y tenue: identifica el tipo de registro sin
          gastar una línea de texto. */}
      {marca && (
        <span
          className="marca-fondo -top-6 -right-6 rotate-12 text-primary opacity-[0.07] [&>svg]:size-36"
          aria-hidden
        >
          {marca}
        </span>
      )}

      <div className="relative flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-on-surface">{titulo}</h2>
          {subtitulo && (
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">{subtitulo}</p>
          )}
        </div>
        <IconAction
          accion="ver"
          etiqueta="Cerrar"
          icono={<X className="size-4" />}
          onClick={alCerrar}
        />
      </div>
    </header>
  );
}
