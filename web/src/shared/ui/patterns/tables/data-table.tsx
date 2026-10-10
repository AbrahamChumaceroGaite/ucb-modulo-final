'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Checkbox } from '../../primitives/fields/toggle';
import { SkeletonRows } from '../../primitives/feedback/skeleton';

/**
 * Tabla de datos.
 *
 * ## Sin estado propio: esto es lo que la hace reutilizable
 *
 * No filtra, no ordena y no pagina por su cuenta. Recibe las filas ya
 * resueltas y **emite la intención** de ordenar o seleccionar. Quien manda es
 * la URL, y quien pide los datos es el servidor.
 *
 * Auditamos una tabla de 495 líneas que filtraba en cliente **y** avisaba al
 * padre con `onSearch`: un listado con búsqueda de servidor se filtraba dos
 * veces, y las filas cuya coincidencia estaba en un campo que no era columna
 * desaparecían.
 *
 * ## Sin bordes verticales
 *
 * Solo divisores horizontales tenues y filas de 40 px, para que quepan más
 * datos sin que la tabla parezca una hoja de cálculo.
 */
export type ColumnaTabla<T> = {
  clave: string;
  titulo: string;
  /** Solo si el backend admite ordenar por ese campo. */
  ordenable?: boolean;
  alineacion?: 'izquierda' | 'derecha';
  /** Clases para la celda: anchos, ocultar en móvil. */
  clase?: string;
  celda: (fila: T) => ReactNode;
};

export type OrdenTabla = { campo: string; direccion: 'asc' | 'desc' } | null;

export function DataTable<T>({
  columnas,
  filas,
  idDe,
  cargando = false,
  orden = null,
  onOrdenar,
  seleccion,
  onSeleccionar,
  acciones,
  vacio,
  className,
}: {
  columnas: ReadonlyArray<ColumnaTabla<T>>;
  filas: readonly T[];
  idDe: (fila: T) => string;
  cargando?: boolean;
  orden?: OrdenTabla;
  onOrdenar?: (campo: string) => void;
  /** Si se pasa, aparece la columna de casillas. */
  seleccion?: ReadonlySet<string>;
  onSeleccionar?: (ids: Set<string>) => void;
  acciones?: (fila: T) => ReactNode;
  /** Se pinta en lugar del cuerpo cuando no hay filas y no está cargando. */
  vacio?: ReactNode;
  className?: string;
}) {
  const conSeleccion = Boolean(seleccion && onSeleccionar);
  const ids = filas.map(idDe);
  const todas = ids.length > 0 && ids.every((id) => seleccion?.has(id));
  const algunas = !todas && ids.some((id) => seleccion?.has(id));

  const alternarTodas = () => {
    if (!onSeleccionar) return;
    onSeleccionar(todas ? new Set() : new Set(ids));
  };

  const alternarUna = (id: string) => {
    if (!onSeleccionar || !seleccion) return;
    const siguiente = new Set(seleccion);
    if (siguiente.has(id)) siguiente.delete(id);
    else siguiente.add(id);
    onSeleccionar(siguiente);
  };

  const columnasTotales = columnas.length + (conSeleccion ? 1 : 0) + (acciones ? 1 : 0);

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-outline-variant">
            {conSeleccion && (
              <th scope="col" className="w-10 px-3 py-2 text-left">
                <Checkbox
                  checked={todas}
                  indeterminado={algunas}
                  onChange={alternarTodas}
                  aria-label="Seleccionar todas las filas"
                />
              </th>
            )}

            {columnas.map((columna) => {
              const activa = orden?.campo === columna.clave;

              return (
                <th
                  key={columna.clave}
                  scope="col"
                  aria-sort={
                    activa ? (orden?.direccion === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={cn(
                    'label-caps px-3 py-2 text-on-surface-variant',
                    columna.alineacion === 'derecha' ? 'text-right' : 'text-left',
                    columna.clase,
                  )}
                >
                  {columna.ordenable && onOrdenar ? (
                    <button
                      type="button"
                      onClick={() => onOrdenar(columna.clave)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-on-surface',
                        activa && 'text-secondary',
                      )}
                    >
                      {columna.titulo}
                      {activa ? (
                        orden?.direccion === 'asc' ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    columna.titulo
                  )}
                </th>
              );
            })}

            {acciones && (
              <th scope="col" className="label-caps w-px px-3 py-2 text-right text-on-surface-variant">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {cargando ? (
            <SkeletonRows filas={5} columnas={columnasTotales} />
          ) : filas.length === 0 ? (
            <tr>
              <td colSpan={columnasTotales} className="px-3 py-8">
                {vacio}
              </td>
            </tr>
          ) : (
            filas.map((fila) => {
              const id = idDe(fila);
              const marcada = seleccion?.has(id) ?? false;

              return (
                <tr
                  key={id}
                  className={cn(
                    'group border-b border-outline-variant/50 transition-colors',
                    'hover:bg-surface-container-high',
                    marcada && 'bg-primary-container/40',
                  )}
                >
                  {conSeleccion && (
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={marcada}
                        onChange={() => alternarUna(id)}
                        aria-label={`Seleccionar fila ${id}`}
                      />
                    </td>
                  )}

                  {columnas.map((columna) => (
                    <td
                      key={columna.clave}
                      className={cn(
                        'h-10 px-3 py-2 text-on-surface',
                        columna.alineacion === 'derecha' && 'text-right',
                        columna.clase,
                      )}
                    >
                      {columna.celda(fila)}
                    </td>
                  ))}

                  {acciones && (
                    <td className="px-3 py-2">
                      <div className="flex justify-end">{acciones(fila)}</div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
