'use client';

import { LayoutGrid, LayoutList, Rows3, Table2 } from 'lucide-react';
import { SegmentedControl } from '../../primitives/fields/segmented';
import type { Vista } from './view';

/**
 * Alternador de vistas de una colección.
 *
 * Es un `SegmentedControl` con iconos y sin texto, así que hereda lo que ya
 * funciona allí: son radios de verdad, se cambian con las flechas y el grupo
 * se anuncia entero. No reimplementa nada.
 *
 * **Las opciones las decide la pantalla**, no este componente: un listado sin
 * tabla no debe ofrecer «tabla». Por eso `opciones` es obligatorio.
 *
 * El estado vive en la URL de la pantalla —como la búsqueda y la página—, no
 * aquí dentro: así la vista elegida sobrevive a una recarga y se comparte por
 * enlace.
 */
const ICONOS: Record<Vista, typeof LayoutGrid> = {
  rejilla: LayoutGrid,
  compacta: Rows3,
  lista: LayoutList,
  tabla: Table2,
};

const NOMBRES: Record<Vista, string> = {
  rejilla: 'Cuadrícula',
  compacta: 'Compacta',
  lista: 'Lista',
  tabla: 'Tabla',
};

export function ViewSwitcher({
  vista,
  opciones,
  onCambiar,
}: {
  vista: Vista;
  opciones: readonly Vista[];
  onCambiar: (vista: Vista) => void;
}) {
  return (
    <SegmentedControl<Vista>
      etiquetaGrupo="Cómo se ve el listado"
      valor={vista}
      onCambiar={onCambiar}
      opciones={opciones.map((opcion) => {
        const Icono = ICONOS[opcion];
        return {
          valor: opcion,
          // Sin texto: cuatro rótulos ocuparían más que la barra de filtros
          // entera. El nombre viaja en el `title` y en el `aria-label`.
          etiqueta: '',
          titulo: NOMBRES[opcion],
          icono: <Icono className="size-4" aria-hidden />,
        };
      })}
    />
  );
}
