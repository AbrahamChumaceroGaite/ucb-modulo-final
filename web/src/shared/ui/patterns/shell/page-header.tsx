import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Breadcrumbs, type Miga } from '../../primitives/navigation/breadcrumbs';

/**
 * Cabecera de pantalla: migas, título, descripción y acciones.
 *
 * Es la misma pieza en todas las pantallas para que el ojo encuentre el botón
 * principal en el mismo sitio siempre.
 *
 * El subtítulo lleva **su propia tipografía declarada**. Parece obvio, pero
 * auditamos un sistema donde el subtítulo del encabezado —usado en 25 archivos—
 * era el único elemento de su bloque sin ninguna regla CSS, y caía al estilo
 * por defecto del párrafo.
 *
 * ## El icono y su fondo
 *
 * Con `icono`, la cabecera se convierte en una superficie con la marca del
 * dominio: el icono en un sello sólido a la izquierda y el mismo dibujo
 * girado y tenue al fondo, como en las tarjetas. Es la misma firma visual, no
 * un adorno nuevo — y por eso está **en el componente** y no copiada en cada
 * pantalla.
 */
export function PageHeader({
  migas,
  titulo,
  descripcion,
  icono,
  acciones,
  className,
}: {
  migas?: readonly Miga[];
  titulo: string;
  descripcion?: string;
  /** La marca del dominio. Se pinta dos veces: en el sello y al fondo. */
  icono?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  const conMarca = Boolean(icono);

  return (
    <header className={cn('flex flex-col gap-3', className)}>
      {migas && migas.length > 0 && <Breadcrumbs migas={migas} />}

      <div
        className={cn(
          'relative flex flex-wrap items-end justify-between gap-3',
          conMarca &&
            'overflow-hidden rounded-xl border border-outline-variant bg-surface-container px-4 py-4 sm:px-5',
        )}
      >
        {conMarca && (
          <span
            className="marca-fondo -top-8 -right-6 rotate-12 text-primary opacity-[0.07] [&>svg]:size-40"
            aria-hidden
          >
            {icono}
          </span>
        )}

        <div className="relative flex min-w-0 flex-1 basis-56 items-start gap-3">
          {conMarca && (
            <span
              className="flex size-10 shrink-0 -rotate-6 items-center justify-center rounded-md bg-primary text-on-primary [&>svg]:size-5"
              aria-hidden
            >
              {icono}
            </span>
          )}

          <div className="min-w-0">
            <h1 className="font-display text-2xl leading-tight font-bold text-secondary sm:text-3xl">
              {titulo}
            </h1>
            {descripcion && <p className="mt-1 text-sm text-on-surface-variant">{descripcion}</p>}
          </div>
        </div>

        {/* `:empty` lo esconde: sin esto, una cabecera sin acciones arrastra un
            hueco de separación que descuadra el título. */}
        <div className="relative flex shrink-0 flex-wrap items-center gap-2 empty:hidden">
          {acciones}
        </div>
      </div>
    </header>
  );
}
