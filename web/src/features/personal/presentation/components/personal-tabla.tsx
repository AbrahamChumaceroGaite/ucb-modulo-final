'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { IconAction, StatusDot, Tag } from '@/shared/ui/primitives';
import { DataTable, type ColumnaTabla } from '@/shared/ui/patterns';
import type { Cliente } from '../../domain/cliente.schema';
import type { Usuario } from '../../domain/usuario.schema';
import { esUsuario } from '../../domain/personal.filtros';
import { nombreCompleto } from '../../domain/persona.schema';

type Fila = Usuario | Cliente;

/**
 * La misma lista, en filas.
 *
 * ## Por qué es un componente y no un array de columnas suelto
 *
 * Porque las columnas llevan JSX —etiquetas, puntos de estado, acciones— y
 * porque **cambian según la colección**: una cuenta tiene correo y rol, un
 * cliente no. Un array exportado obligaría a la vista a elegir entre dos, y a
 * repetir el `<DataTable>` con sus props en las dos ramas.
 *
 * ## Qué columnas se esconden al estrechar
 *
 * Carnet y teléfono (`hidden sm:table-cell`, `hidden lg:table-cell`). Lo que
 * nunca se esconde es el nombre, el estado y las acciones: son lo que permite
 * identificar la fila y actuar sobre ella. Esconder la acción obligaría a
 * cambiar de vista para editar, que es justo lo que esta vista evita.
 *
 * Las acciones se revelan al atender la fila, igual que en las tarjetas: es
 * `<IconActionGroup>` quien lo hace, dentro de `<DataTable>`.
 */
export function PersonalTabla({
  filas,
  cargando,
  onVer,
  onEditar,
  onEliminar,
}: {
  filas: readonly Fila[];
  cargando: boolean;
  onVer: (fila: Fila) => void;
  onEditar: (fila: Fila) => void;
  onEliminar: (fila: Fila) => void;
}) {
  // Si la primera fila es una cuenta, todas lo son: la vista nunca mezcla las
  // dos colecciones. Es la misma comprobación que hacen las tarjetas.
  const conCuenta = filas.length > 0 && filas.every(esUsuario);

  const columnas: ColumnaTabla<Fila>[] = [
    {
      clave: 'nombre',
      titulo: 'Nombre',
      celda: (fila) => (
        <span className="font-medium text-on-surface">{nombreCompleto(fila.persona)}</span>
      ),
    },
    {
      clave: 'carnet',
      titulo: 'Carnet',
      clase: 'hidden sm:table-cell',
      celda: (fila) => fila.persona.carnet,
    },
    {
      clave: 'telefono',
      titulo: 'Teléfono',
      clase: 'hidden lg:table-cell',
      celda: (fila) => fila.persona.telefono ?? '—',
    },
    ...(conCuenta
      ? ([
          {
            clave: 'correo',
            titulo: 'Correo',
            clase: 'hidden md:table-cell',
            celda: (fila: Fila) => (esUsuario(fila) ? fila.correo : '—'),
          },
          {
            clave: 'rol',
            titulo: 'Rol',
            celda: (fila: Fila) =>
              esUsuario(fila) ? <Tag tono="primary">{fila.rol.nombre}</Tag> : null,
          },
        ] satisfies ColumnaTabla<Fila>[])
      : []),
    {
      clave: 'estado',
      titulo: 'Estado',
      celda: (fila) => (
        <StatusDot tono={fila.borrado ? 'neutral' : 'success'}>
          {fila.borrado ? 'Dada de baja' : 'Activa'}
        </StatusDot>
      ),
    },
  ];

  return (
    <DataTable
      filas={filas}
      columnas={columnas}
      cargando={cargando}
      idDe={(fila) => fila.id}
      acciones={(fila) => (
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la ficha de ${nombreCompleto(fila.persona)}`}
            icono={<Eye className="size-4" />}
            onClick={() => onVer(fila)}
          />
          <IconAction
            accion="editar"
            etiqueta={`Editar a ${nombreCompleto(fila.persona)}`}
            icono={<Pencil className="size-4" />}
            onClick={() => onEditar(fila)}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Dar de baja a ${nombreCompleto(fila.persona)}`}
            icono={<Trash2 className="size-4" />}
            onClick={() => onEliminar(fila)}
            disabled={fila.borrado}
          />
        </>
      )}
    />
  );
}
