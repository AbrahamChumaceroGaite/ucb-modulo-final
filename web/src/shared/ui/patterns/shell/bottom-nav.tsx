'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ACCION_CENTRAL, ENTRADA_CATALOGO, NAVEGACION } from '@/shared/config/routes';
import { ICONOS } from './bottom-nav.data';

/**
 * Navegación principal: píldora flotante en escritorio, barra anclada en móvil.
 *
 * **No hay barra lateral**, en ninguna medida. Una lateral se come entre 200 y
 * 250 px de ancho para repetir tres enlaces, y en móvil hay que esconderla
 * detrás de un botón de hamburguesa que nadie pulsa.
 *
 * ## Dos formas, no dos componentes
 *
 * - **Escritorio:** píldora flotante, centrada abajo, fuera del camino del
 *   contenido.
 * - **Móvil:** anclada al borde inferior, de lado a lado y con las **esquinas
 *   de arriba curvadas**, que es la forma que el sistema operativo ya enseñó.
 *   Flotando en un teléfono robaría dos márgenes a una pantalla que no los
 *   tiene.
 *
 * ## El relleno que sí hace falta
 *
 * Los enlaces son **pastillas redondas**, así que la barra lleva 4 px de
 * relleno para que respiren. Sin él, el fondo del enlace activo lo recortaba
 * el borde curvo del contenedor y quedaba una esquina rebanada.
 *
 * No es el caso del segmentado: allí la pastilla ocupa el alto entero y el
 * relleno solo servía para dejar asomar un anillo del contenedor. Aquí el
 * relleno **es** la separación entre dos formas redondas. La regla no es
 * «nunca relleno», es «nada que asome sin querer».
 *
 * ## El botón del centro
 *
 * Registrar una venta se hace veinte veces por turno; entrar a la despensa,
 * dos. No comparten sitio: la venta va en el medio, redonda y en color de
 * marca, donde el pulgar cae sin apuntar.
 */
export function BottomNav() {
  const ruta = usePathname();

  // El corte se calcula sobre la navegación real, no sobre la lista con el
  // catálogo: si no, en desarrollo el botón del centro dejaba de estar en el
  // centro. El catálogo se añade después, a la derecha, porque solo existe
  // aquí —en producción `/ui` responde 404—.
  const corte = Math.ceil(NAVEGACION.length / 2);
  const izquierda = NAVEGACION.slice(0, corte);
  const derecha = [
    ...NAVEGACION.slice(corte),
    ...(process.env.NODE_ENV === 'production' ? [] : [ENTRADA_CATALOGO]),
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        'fixed z-30 flex items-center gap-0.5 p-1',
        'border border-outline-variant bg-surface-container-high/95 backdrop-blur-md',
        'shadow-[var(--shadow-flotante)]',
        // Móvil: pegada abajo, de lado a lado, solo las esquinas de arriba.
        'inset-x-0 bottom-0 rounded-t-xl border-b-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]',
        // Escritorio: píldora centrada que no toca ningún borde.
        'sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-fit sm:-translate-x-1/2',
        'sm:rounded-full sm:border-b sm:pb-1',
      )}
    >
      <Grupo entradas={izquierda} ruta={ruta} />

      {/* Entre los dos grupos, no al final: el centro es el sitio al que el
          pulgar llega sin mirar. */}
      <Link
        href={ACCION_CENTRAL.href}
        aria-label={ACCION_CENTRAL.etiqueta}
        className={cn(
          'mx-1 flex size-9 shrink-0 items-center justify-center rounded-full',
          'bg-primary text-on-primary transition-transform duration-200 ease-[var(--ease-burbuja)]',
          'hover:scale-110 active:scale-95',
        )}
      >
        <Plus className="size-4" aria-hidden />
      </Link>

      <Grupo entradas={derecha} ruta={ruta} />
    </nav>
  );
}

/** Mitad de la barra. Existe para no escribir dos veces el mismo `map`. */
function Grupo({
  entradas,
  ruta,
}: {
  entradas: readonly { href: string; etiqueta: string; icono: keyof typeof ICONOS }[];
  ruta: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:flex-none">
      {entradas.map((entrada) => {
        const Icono = ICONOS[entrada.icono];
        const activo = ruta === entrada.href || ruta.startsWith(`${entrada.href}/`);

        return (
          <Link
            key={entrada.href}
            href={entrada.href}
            aria-current={activo ? 'page' : undefined}
            className={cn(
              // `min-w-0` y el rótulo recortable: con seis entradas los anchos
              // naturales suman más de lo que hay en un teléfono, y sin esto
              // la última se sale de la barra.
              'flex h-10 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2',
              'transition-colors duration-150 sm:w-auto sm:min-w-[4.5rem] sm:flex-none sm:px-3',
              activo
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface',
            )}
          >
            <Icono className="size-4 shrink-0" aria-hidden />
            <span className="max-w-full truncate text-[0.625rem] leading-none font-medium">
              {entrada.etiqueta}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
