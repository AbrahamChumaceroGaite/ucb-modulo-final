'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { IconAction, StatusDot, Tag } from '@/shared/ui/primitives';
import { DataTable, type ColumnaTabla } from '@/shared/ui/patterns';
import { formatearFechaHora, formatearMoneda } from '@/shared/lib/format';
import { lineasVigentes, type Venta } from '../../domain/venta.schema';

/**
 * El mismo libro de ventas, en filas.
 *
 * Misma forma que las otras tres tablas: las columnas llevan JSX, las
 * secundarias se esconden al estrechar, y **nunca se esconden** lo que
 * identifica la fila, el estado y las acciones (regla 8.10).
 *
 * La columna de estado dice lo mismo que la insignia de la tarjeta: cambiar de
 * vista cambia el formato, nunca la información (regla 8.10).
 *
 * El importe va a la derecha y con `tabular-nums`, que es lo que permite
 * cuadrar una columna de cifras de un vistazo.
 */
export function VentaTabla({
  filas,
  nombreDelCliente,
  cargando,
  onVer,
  onEditar,
  onEliminar,
}: {
  filas: readonly Venta[];
  nombreDelCliente: (venta: Venta) => string | undefined;
  cargando: boolean;
  onVer: (venta: Venta) => void;
  onEditar: (venta: Venta) => void;
  onEliminar: (venta: Venta) => void;
}) {
  const columnas: ColumnaTabla<Venta>[] = [
    {
      clave: 'fecha',
      titulo: 'Cuándo',
      celda: (venta) => (
        <span className="font-medium text-on-surface">{formatearFechaHora(venta.fechaVenta)}</span>
      ),
    },
    {
      clave: 'cliente',
      titulo: 'Cliente',
      clase: 'hidden md:table-cell',
      celda: (venta) => nombreDelCliente(venta) ?? 'Mostrador',
    },
    {
      clave: 'lineas',
      titulo: 'Líneas',
      alineacion: 'derecha',
      clase: 'hidden lg:table-cell',
      celda: (venta) => lineasVigentes(venta).length,
    },
    {
      clave: 'estadoVenta',
      titulo: 'Cómo quedó',
      clase: 'hidden sm:table-cell',
      celda: (venta) =>
        venta.estadoVenta ? <Tag tono="secondary">{venta.estadoVenta.nombre}</Tag> : '—',
    },
    {
      clave: 'total',
      titulo: 'Total',
      alineacion: 'derecha',
      celda: (venta) => (
        <span className="tabular-nums">{formatearMoneda(venta.total)}</span>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      celda: (venta) => (
        <StatusDot tono={venta.borrado ? 'neutral' : 'success'}>
          {venta.borrado ? 'Anulada' : 'Registrada'}
        </StatusDot>
      ),
    },
  ];

  return (
    <DataTable
      filas={filas}
      columnas={columnas}
      cargando={cargando}
      idDe={(venta) => venta.id}
      acciones={(venta) => (
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver el detalle de la venta de ${formatearFechaHora(venta.fechaVenta)}`}
            icono={<Eye className="size-4" />}
            onClick={() => onVer(venta)}
          />
          <IconAction
            accion="editar"
            etiqueta={`Corregir la venta de ${formatearFechaHora(venta.fechaVenta)}`}
            icono={<Pencil className="size-4" />}
            onClick={() => onEditar(venta)}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Anular la venta de ${formatearFechaHora(venta.fechaVenta)}`}
            icono={<Trash2 className="size-4" />}
            onClick={() => onEliminar(venta)}
            disabled={venta.borrado}
          />
        </>
      )}
    />
  );
}
