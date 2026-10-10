'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { RUTAS } from '@/shared/config/routes';

/**
 * La barra superior: la marca a la izquierda y lo que haga falta a la derecha.
 *
 * ## Por qué existe
 *
 * Había dos barras: la del panel y otra escrita a mano en el layout del
 * catálogo. La segunda era una copia literal que ya se había quedado atrás —
 * cuadrada, sin la animación, con sus propias clases—. Es exactamente el
 * defecto que medimos auditando: un componente de cabecera y media docena de
 * cabeceras sueltas que se le parecen.
 *
 * Ahora hay una. Lo que cambia entre pantallas son sus `children`.
 *
 * ## Se despega al bajar
 *
 * En reposo ocupa **el ancho entero** y curva su base, como cualquier otra
 * superficie del sistema. Al desplazarse se separa de los tres bordes, se
 * encoge al ancho del lienzo y se vuelve una píldora translúcida con
 * desenfoque: el contenido se ve pasar por debajo en lugar de desaparecer bajo
 * un bloque opaco.
 *
 * Estuvo inset por los lados también en reposo, y se veía mal: una barra
 * separada de los bordes pero pegada arriba, con la línea inferior terminando
 * en el aire a tres píxeles del borde. O flota entera, o está pegada entera.
 *
 * El gesto está tomado del panel que auditamos, que lo hacía bien; lo que allí
 * fallaba era la medida —la barra ocupaba el 90 % del ancho y el contenido el
 * 100 %, así que los bordes quedaban desfasados tres píxeles en cada
 * pantalla—. Aquí flotante y pegada comparten el mismo ancho de lienzo.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [flotante, setFlotante] = useState(false);

  useEffect(() => {
    // `passive` porque solo se lee la posición: sin esto el navegador tiene
    // que esperar a saber si el manejador cancela el desplazamiento.
    const alDesplazar = () => setFlotante(window.scrollY > 8);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  return (
    <div
      className={cn(
        'sticky top-0 z-30 transition-[padding] duration-300 ease-[var(--ease-suave)]',
        flotante ? 'px-3 sm:px-4' : 'px-0',
      )}
    >
      <header
        className={cn(
          'mx-auto flex h-12 items-center gap-2',
          'transition-all duration-300 ease-[var(--ease-suave)]',
          flotante
            ? [
                'mt-2 max-w-[var(--spacing-lienzo)] rounded-full px-3 sm:px-4',
                'border border-outline-variant bg-surface-container/70',
                'shadow-[var(--shadow-flotante)] backdrop-blur-xl',
              ]
            : [
                'mt-0 w-full rounded-b-xl px-4 sm:px-6',
                'border-x-0 border-t-0 border-b border-outline-variant',
                'bg-surface/85 backdrop-blur-md',
              ],
        )}
      >
        <Link
          href={RUTAS.landing}
          className="flex shrink-0 items-center gap-2 text-on-surface"
          aria-label="Kaffehaus, ir al inicio"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
            <Coffee className="size-4" aria-hidden />
          </span>
          <span className="hidden font-display text-sm font-bold sm:inline">Kaffehaus</span>
        </Link>

        {children}
      </header>
    </div>
  );
}
