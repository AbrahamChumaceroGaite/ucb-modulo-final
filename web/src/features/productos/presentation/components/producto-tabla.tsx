'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { IconAction, Tag } from '@/shared/ui/primitives';
import { DataTable, type ColumnaTabla } from '@/shared/ui/patterns';
import { formatearCantidad, formatearMoneda } from '@/shared/lib/format';
import type { Producto } from '../../domain/producto.schema';
import { ProductoStockDot } from './producto-stock-dot';

/**
 * La misma despensa, en filas.
 *
 * Mismo criterio que `<PersonalTabla>`: lo que nunca se esconde al estrechar
 * es el nombre, el nivel y las acciones —identificar la fila y actuar sobre
 * ella—; el resto va cayendo por anchura.
 *
 * Las cifras llevan `data-tabular` a través del `<table>`, así que las
 * columnas de precio y existencias alinean por dígito sin hacer nada más.
 */
export function ProductoTabla({
  filas,
  cargando,
  onVer,
  onEditar,
  onEliminar,
}: {
  filas: readonly Producto[];
  cargando: boolean;
  onVer: (producto: Producto) => void;
  onEditar: (producto: Producto) => void;
  onEliminar: (producto: Producto) => void;
}) {
  const columnas: ColumnaTabla<Producto>[] = [
    {
      clave: 'nombre',
      titulo: 'Producto',
      celda: (producto) => (
        <span className="font-medium text-on-surface">{producto.nombre}</span>
      ),
    },
    {
      clave: 'carta',
      titulo: 'En la carta',
      clase: 'hidden md:table-cell',
      celda: (producto) => (
        <Tag tono={producto.vendible ? 'primary' : 'secondary'}>
          {producto.vendible ? 'Se vende' : 'Solo despensa'}
        </Tag>
      ),
    },
    {
      clave: 'categoria',
      titulo: 'Categoría',
      clase: 'hidden lg:table-cell',
      celda: (producto) => producto.categoria?.nombre ?? '—',
    },
    {
      clave: 'existencias',
      titulo: 'Existencias',
      alineacion: 'derecha',
      clase: 'hidden sm:table-cell',
      celda: (producto) =>
        formatearCantidad(producto.stock, producto.unidadActual?.abreviatura ?? ''),
    },
    {
      clave: 'precio',
      titulo: 'Precio',
      alineacion: 'derecha',
      clase: 'hidden sm:table-cell',
      celda: (producto) => formatearMoneda(producto.precio),
    },
    {
      clave: 'nivel',
      titulo: 'Estado',
      celda: (producto) => <ProductoStockDot producto={producto} />,
    },
  ];

  return (
    <DataTable
      filas={filas}
      columnas={columnas}
      cargando={cargando}
      idDe={(producto) => producto.id}
      acciones={(producto) => (
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la ficha de ${producto.nombre}`}
            icono={<Eye className="size-4" />}
            onClick={() => onVer(producto)}
          />
          <IconAction
            accion="editar"
            etiqueta={`Editar ${producto.nombre}`}
            icono={<Pencil className="size-4" />}
            onClick={() => onEditar(producto)}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Dar de baja ${producto.nombre}`}
            icono={<Trash2 className="size-4" />}
            onClick={() => onEliminar(producto)}
            disabled={producto.borrado}
          />
        </>
      )}
    />
  );
}
