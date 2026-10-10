'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { IconAction, StatusDot } from '@/shared/ui/primitives';
import { DataTable, type ColumnaTabla } from '@/shared/ui/patterns';
import { tandasPosibles, type Receta } from '../../domain/receta.schema';
import { conUnidad, type ReferenciaDeProducto } from '../../domain/referencia-producto.schema';

/**
 * El mismo recetario, en filas.
 *
 * Misma forma que `<PersonalTabla>` y `<ProductoTabla>`: las columnas llevan
 * JSX, las secundarias se esconden al estrechar, y **nunca se esconden** el
 * nombre, el estado y las acciones — son lo que permite identificar la fila y
 * actuar sobre ella. Esconder la acción obligaría a cambiar de vista para
 * editar, que es justo lo que esta vista evita (regla 8.10).
 *
 * La columna de estado dice lo mismo que la insignia de la tarjeta: cambiar de
 * vista cambia el formato, nunca la información.
 */
export function RecetaTabla({
  filas,
  productos,
  cargando,
  onVer,
  onEditar,
  onEliminar,
}: {
  filas: readonly Receta[];
  productos: ReadonlyMap<string, ReferenciaDeProducto>;
  cargando: boolean;
  onVer: (receta: Receta) => void;
  onEditar: (receta: Receta) => void;
  onEliminar: (receta: Receta) => void;
}) {
  const stock = new Map([...productos].map(([id, producto]) => [id, producto.stock]));

  const columnas: ColumnaTabla<Receta>[] = [
    {
      clave: 'titulo',
      titulo: 'Receta',
      celda: (receta) => <span className="font-medium text-on-surface">{receta.titulo}</span>,
    },
    {
      clave: 'obtiene',
      titulo: 'Produce',
      clase: 'hidden md:table-cell',
      celda: (receta) => productos.get(receta.idProductoObtenido)?.nombre ?? '—',
    },
    {
      clave: 'rinde',
      titulo: 'Rinde',
      alineacion: 'derecha',
      clase: 'hidden sm:table-cell',
      celda: (receta) => conUnidad(receta.cantidad, productos.get(receta.idProductoObtenido)),
    },
    {
      clave: 'ingredientes',
      titulo: 'Lleva',
      alineacion: 'derecha',
      clase: 'hidden lg:table-cell',
      celda: (receta) => receta.ingredientes.filter((uno) => !uno.borrado).length,
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      celda: (receta) => {
        if (receta.borrado) return <StatusDot tono="neutral">Dada de baja</StatusDot>;

        const tandas = tandasPosibles(receta, stock);
        // `null` es «no lo sé», no «cero». Se dice con palabras.
        if (tandas === null) return <StatusDot tono="neutral">Sin datos de stock</StatusDot>;
        if (tandas === 0) return <StatusDot tono="danger">No alcanza</StatusDot>;

        return (
          <StatusDot tono={tandas < 3 ? 'warning' : 'success'}>
            {`${tandas} tanda${tandas === 1 ? '' : 's'}`}
          </StatusDot>
        );
      },
    },
  ];

  return (
    <DataTable
      filas={filas}
      columnas={columnas}
      cargando={cargando}
      idDe={(receta) => receta.id}
      acciones={(receta) => (
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la receta de ${receta.titulo}`}
            icono={<Eye className="size-4" />}
            onClick={() => onVer(receta)}
          />
          <IconAction
            accion="editar"
            etiqueta={`Editar ${receta.titulo}`}
            icono={<Pencil className="size-4" />}
            onClick={() => onEditar(receta)}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Dar de baja ${receta.titulo}`}
            icono={<Trash2 className="size-4" />}
            onClick={() => onEliminar(receta)}
            disabled={receta.borrado}
          />
        </>
      )}
    />
  );
}
