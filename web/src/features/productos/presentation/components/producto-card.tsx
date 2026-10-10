'use client';

import { Boxes, Eye, Package, Pencil, Trash2 } from 'lucide-react';
import { IconAction, ProgressBar, Tag } from '@/shared/ui/primitives';
import { EntityCard, type Vista } from '@/shared/ui/patterns';
import { TONO_POR_NIVEL } from '@/shared/config/levels';
import { formatearCantidad, formatearMoneda } from '@/shared/lib/format';
import { nivelDeStock, TEXTO_NIVEL, type Producto } from '../../domain/producto.schema';

/**
 * La tarjeta de un producto.
 *
 * Misma anatomía que `<PersonaCard>` y por la misma razón: las dos salen de
 * `<EntityCard>`, así que el acento de estado, la marca girada, las acciones
 * que se revelan y la adaptación a la vista se escriben **una vez**.
 *
 * Lo que cambia aquí es la carga: en vez de carnet y teléfono, precio y
 * existencias, y en el pie la barra de nivel — que es lo que permite barrer
 * una rejilla y ver de un vistazo qué hay que reponer.
 *
 * El nivel no se decide aquí: lo calcula `nivelDeStock`, que es negocio y vive
 * en el dominio. La tarjeta solo lo pinta.
 */
export function ProductoCard({
  producto,
  vista,
  onVer,
  onEditar,
  onEliminar,
}: {
  producto: Producto;
  vista: Vista;
  onVer: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const nivel = nivelDeStock(producto);
  const tono = TONO_POR_NIVEL[nivel];
  const abreviatura = producto.unidadActual?.abreviatura ?? '';
  // Lo que separa la carta de la despensa es `vendible`, el único campo que
  // el backend tiene para eso.
  const enLaCarta = producto.vendible;

  return (
    <EntityCard
      categoria={producto.categoria?.nombre ?? 'Sin categoría'}
      titulo={producto.nombre}
      estado={TEXTO_NIVEL[nivel]}
      tono={producto.borrado ? 'neutral' : tono}
      marca={enLaCarta ? <Package /> : <Boxes />}
      medio={enLaCarta ? <Package className="size-5" /> : <Boxes className="size-5" />}
      vista={vista}
      {...(producto.borrado ? { insignia: <Tag tono="neutral">Dado de baja</Tag> } : {})}
      datos={[
        { icono: <Package />, texto: formatearMoneda(producto.precio) },
        { icono: <Boxes />, texto: formatearCantidad(producto.stock, abreviatura) },
      ]}
      acciones={
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la ficha de ${producto.nombre}`}
            icono={<Eye className="size-4" />}
            onClick={onVer}
          />
          <IconAction
            accion="editar"
            etiqueta={`Editar ${producto.nombre}`}
            icono={<Pencil className="size-4" />}
            onClick={onEditar}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Dar de baja ${producto.nombre}`}
            icono={<Trash2 className="size-4" />}
            onClick={onEliminar}
            disabled={producto.borrado}
          />
        </>
      }
      pie={
        producto.stockMinimo > 0 ? (
          <div>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-on-surface-variant">Existencias</span>
              <span data-tabular className="font-medium text-on-surface">
                {formatearCantidad(producto.stock, abreviatura)} de{' '}
                {formatearCantidad(producto.stockMinimo, abreviatura)}
              </span>
            </div>
            <ProgressBar
              className="mt-2"
              valor={producto.stock}
              maximo={producto.stockMinimo}
              tono={tono}
              etiqueta={`Existencias de ${producto.nombre}`}
            />
          </div>
        ) : (
          // Sin mínimo declarado no hay barra: una barra al 100 % diría «bien
          // surtido» cuando lo que pasa es que nadie fijó el umbral.
          <span className="text-xs text-on-surface-variant">Sin mínimo declarado</span>
        )
      }
    />
  );
}
