'use client';

import { Eye, Pencil, Receipt, ShoppingBag, Trash2, UserRound } from 'lucide-react';
import { IconAction, Tag } from '@/shared/ui/primitives';
import { EntityCard, type Vista } from '@/shared/ui/patterns';
import { formatearFechaHora, formatearMoneda } from '@/shared/lib/format';
import { lineasVigentes, type Venta } from '../../domain/venta.schema';

/**
 * La tarjeta de una venta.
 *
 * Misma anatomía que las otras tres y por la misma razón: todas salen de
 * `<EntityCard>`, así que la marca girada, las acciones que se revelan al
 * atender la fila y la adaptación a la vista se escriben **una vez**.
 *
 * Lo que cambia es la carga: cuándo fue, a quién y cuánto.
 *
 * ## El total es el del servidor
 *
 * Se pinta `venta.total` tal cual, sin recalcular las líneas. Si las dos
 * cifras no coincidieran, la que vale es la del servidor —es la que se
 * cobró—, y taparlo con una suma local escondería el problema.
 *
 * ## «Mostrador» no es un dato que falte
 *
 * `idCliente` admite `NULL` en la base y es `textoOpcional` en el alta. Una
 * venta sin cliente es una venta de mostrador, así que se dice con esa
 * palabra y no con un hueco vacío, que se lee como «no cargó».
 */
export function VentaCard({
  venta,
  nombreDelCliente,
  vista,
  onVer,
  onEditar,
  onEliminar,
}: {
  venta: Venta;
  /** Ya resuelto por la pantalla. La tarjeta no sale a buscar nada. */
  nombreDelCliente?: string;
  vista: Vista;
  onVer: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const lineas = lineasVigentes(venta);

  return (
    <EntityCard
      categoria={venta.estadoVenta?.nombre ?? 'Sin estado'}
      titulo={formatearMoneda(venta.total)}
      tono={venta.borrado ? 'neutral' : 'primary'}
      marca={<Receipt />}
      medio={<Receipt className="size-5" />}
      vista={vista}
      {...(venta.borrado ? { insignia: <Tag tono="neutral">Anulada</Tag> } : {})}
      datos={[
        { icono: <Receipt />, texto: formatearFechaHora(venta.fechaVenta) },
        { icono: <UserRound />, texto: nombreDelCliente ?? 'Mostrador' },
        {
          icono: <ShoppingBag />,
          texto: `${lineas.length} línea${lineas.length === 1 ? '' : 's'}`,
        },
      ]}
      acciones={
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver el detalle de la venta de ${formatearFechaHora(venta.fechaVenta)}`}
            icono={<Eye className="size-4" />}
            onClick={onVer}
          />
          <IconAction
            accion="editar"
            etiqueta={`Corregir la venta de ${formatearFechaHora(venta.fechaVenta)}`}
            icono={<Pencil className="size-4" />}
            onClick={onEditar}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Anular la venta de ${formatearFechaHora(venta.fechaVenta)}`}
            icono={<Trash2 className="size-4" />}
            onClick={onEliminar}
            disabled={venta.borrado}
          />
        </>
      }
    />
  );
}
