'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/** Cuánto avanza cada flecha: algo menos de un ancho, para no perder el hilo. */
const PASO = 0.8;

/**
 * Una fila que no se parte: lo que no cabe se desplaza, con flechas.
 *
 * ## Por qué existe, y por qué aquí
 *
 * La barra de filtros envolvía sus grupos en varias líneas. Con cuatro grupos
 * eso son dos o tres renglones de chips comiéndose la pantalla antes de
 * enseñar un solo registro — se ve en cuanto se abre la pantalla en un portátil.
 *
 * El primer intento puso el desplazamiento **dentro** de cada grupo de chips, y
 * no servía de nada: el contenedor seguía envolviendo, así que cada grupo cabía
 * en su propia línea y las flechas no aparecían nunca. Lo comprobé midiendo
 * `scrollWidth` contra `clientWidth` en el navegador: iguales, siempre.
 *
 * El desplazamiento tiene que estar donde está el desbordamiento, que es **la
 * fila entera**. Por eso es una pieza aparte y no una opción de los chips: la
 * usa quien tenga una fila que no debe partirse, y los chips vuelven a ser lo
 * que son, un grupo de botones.
 *
 * ## Las flechas
 *
 * Aparecen **solo cuando hay algo hacia ese lado** —un control que nunca hace
 * nada enseña a ignorarlo— y se recalculan al desplazar y al cambiar el ancho.
 * Antes solo había un degradado, y un degradado no se puede pulsar: en un
 * escritorio sin rueda horizontal dejaba opciones inalcanzables.
 *
 * Van fuera del contenido y marcadas `aria-hidden`: con el teclado se llega a
 * los controles con el tabulador, que los desplaza solos, y anunciar dos
 * botones de «desplazar» sería ruido.
 */
export function HorizontalScroller({
  children,
  etiqueta,
  className,
}: {
  children: ReactNode;
  /** Qué contiene la fila, para el `aria-label` de la pista. */
  etiqueta: string;
  className?: string;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const [haciaIzquierda, setHaciaIzquierda] = useState(false);
  const [haciaDerecha, setHaciaDerecha] = useState(false);

  const medir = useCallback(() => {
    const nodo = pista.current;
    if (!nodo) return;
    // 1px de margen: los anchos fraccionarios dejan restos de medio píxel que
    // encenderían una flecha que no lleva a ninguna parte.
    setHaciaIzquierda(nodo.scrollLeft > 1);
    setHaciaDerecha(nodo.scrollLeft + nodo.clientWidth < nodo.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const nodo = pista.current;
    if (!nodo) return;

    medir();
    nodo.addEventListener('scroll', medir, { passive: true });

    // Sin esto, plegar el panel lateral o abrir la hoja de filtros deja las
    // flechas mintiendo hasta que alguien desplaza.
    const observador = new ResizeObserver(medir);
    observador.observe(nodo);
    for (const hijo of nodo.children) observador.observe(hijo);

    return () => {
      nodo.removeEventListener('scroll', medir);
      observador.disconnect();
    };
  }, [medir, children]);

  const desplazar = (sentido: 1 | -1) => {
    const nodo = pista.current;
    if (!nodo) return;
    nodo.scrollBy({ left: sentido * nodo.clientWidth * PASO, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative flex min-w-0 flex-1 items-center', className)}>
      {haciaIzquierda && <Flecha sentido="izquierda" onPulsar={() => desplazar(-1)} />}

      <div
        ref={pista}
        aria-label={etiqueta}
        className={cn(
          'flex min-w-0 flex-1 flex-nowrap items-center gap-x-4 overflow-x-auto pb-0.5',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {children}
      </div>

      {haciaDerecha && <Flecha sentido="derecha" onPulsar={() => desplazar(1)} />}
    </div>
  );
}

/**
 * La flecha, con su velo degradado hacia el contenido.
 *
 * El degradado sigue estando —es lo que hace evidente que algo continúa por
 * debajo—, pero ahora tiene encima algo que se puede pulsar.
 */
function Flecha({ sentido, onPulsar }: { sentido: 'izquierda' | 'derecha'; onPulsar: () => void }) {
  const izquierda = sentido === 'izquierda';

  return (
    <div
      aria-hidden
      className={cn(
        'absolute top-0 bottom-0 z-10 flex items-center',
        izquierda ? 'left-0 bg-gradient-to-r pr-5' : 'right-0 bg-gradient-to-l pl-5',
        'from-surface-container via-surface-container/85 to-transparent',
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onPulsar}
        className={cn(
          'flex size-6 items-center justify-center rounded-full border border-outline-variant',
          'bg-surface-container-high text-on-surface-variant shadow-sm',
          'transition-colors hover:border-outline hover:text-on-surface',
        )}
      >
        {izquierda ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
    </div>
  );
}
