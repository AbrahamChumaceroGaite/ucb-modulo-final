import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * El esqueleto de **toda** pantalla de listado: cabecera, filtros y contenido.
 *
 * Es delgado a propósito —tres huecos y un ritmo vertical— y aun así merece
 * existir: es el único sitio donde se decide cuánto respira una pantalla de
 * lista. Sin él, cada vista escribe su propio `gap` y en tres pantallas hay
 * tres separaciones distintas. Es exactamente lo que medimos auditando, donde
 * seis contenedores de página repetían la misma maquetación con variaciones.
 *
 * Lo que **no** hace: no sabe qué se lista, no filtra, no pagina y no decide
 * la vista. Recibe piezas ya montadas. Si algún día necesita saber de datos,
 * está mal planteado.
 */
export function ListLayout({
  cabecera,
  filtros,
  children,
  className,
}: {
  cabecera: ReactNode;
  /** La `<FilterBar>` de la pantalla. Opcional: no todo listado filtra. */
  filtros?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {cabecera}
      {filtros}
      {children}
    </div>
  );
}
