'use client';

import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  FilterChips,
  IconAction,
  IconActionGroup,
  Pagination,
  StatusDot,
  Tag,
} from '@/shared/ui/primitives';
import { DataTable, EmptyState, type ColumnaTabla, type OrdenTabla } from '@/shared/ui/patterns';
import { formatearCantidad, formatearMoneda } from '@/shared/lib/format';
import { Muestra, Seccion } from '../_components/showcase';
import { TEXTO_POR_NIVEL, TONO_POR_NIVEL } from '@/shared/config/levels';
import { CATEGORIAS, FILAS, type FilaInsumo } from '../_data/tabla';

/**
 * La tabla, con selección, orden y paginación.
 *
 * Aquí el estado vive en este componente porque es un escaparate sin URL
 * propia. En una pantalla real vive en la dirección, que es lo que permite
 * compartir una vista filtrada. La tabla se comporta igual en los dos casos:
 * recibe filas y emite intenciones.
 */

export function SeccionDatos() {
  const [categorias, setCategorias] = useState<readonly string[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [orden, setOrden] = useState<OrdenTabla>({ campo: 'nombre', direccion: 'asc' });
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);

  const filtradas = useMemo(() => {
    const base =
      categorias.length > 0
        ? FILAS.filter((fila) => categorias.includes(fila.categoria))
        : FILAS;
    if (!orden) return base;

    return [...base].sort((a, b) => {
      const signo = orden.direccion === 'asc' ? 1 : -1;
      if (orden.campo === 'precio') return (a.precio - b.precio) * signo;
      if (orden.campo === 'stock') return (a.stock - b.stock) * signo;
      return a.nombre.localeCompare(b.nombre, 'es') * signo;
    });
  }, [categorias, orden]);

  const pagina = filtradas.slice(skip, skip + limit);

  const alternarOrden = (campo: string) => {
    setOrden((actual) =>
      actual?.campo === campo
        ? { campo, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: 'asc' },
    );
  };

  const columnas: ReadonlyArray<ColumnaTabla<FilaInsumo>> = [
    {
      clave: 'nombre',
      titulo: 'Insumo',
      ordenable: true,
      celda: (fila) => <span className="font-medium text-on-surface">{fila.nombre}</span>,
    },
    {
      clave: 'categoria',
      titulo: 'Categoría',
      clase: 'hidden md:table-cell',
      celda: (fila) => <Tag tono="neutral">{fila.categoria}</Tag>,
    },
    {
      clave: 'stock',
      titulo: 'Existencias',
      ordenable: true,
      alineacion: 'derecha',
      clase: 'hidden sm:table-cell',
      celda: (fila) => (
        <span data-tabular>
          {formatearCantidad(fila.stock, fila.unidad)}
          <span className="ml-1 text-xs text-on-surface-variant">
            / {formatearCantidad(fila.minimo)}
          </span>
        </span>
      ),
    },
    {
      clave: 'nivel',
      titulo: 'Estado',
      clase: 'hidden lg:table-cell',
      celda: (fila) => <StatusDot tono={TONO_POR_NIVEL[fila.nivel]}>{TEXTO_POR_NIVEL[fila.nivel]}</StatusDot>,
    },
    {
      clave: 'precio',
      titulo: 'Precio',
      ordenable: true,
      alineacion: 'derecha',
      celda: (fila) => (
        <span data-tabular className="font-medium">
          {formatearMoneda(fila.precio)}
        </span>
      ),
    },
  ];

  return (
    <Seccion
      id="datos"
      titulo="Tablas"
      descripcion="Sin bordes verticales, filas de 40 px y divisores tenues. Las columnas secundarias se esconden al estrechar, no se apelotonan."
    >
      <Muestra titulo="Filtros" nota="Selección múltiple. La fila se desplaza en horizontal, con flechas cuando hay más de lo que cabe.">
        <FilterChips
          opciones={CATEGORIAS}
          valores={categorias}
          etiquetaGrupo="Filtrar por categoría"
          onCambiar={(valores) => {
            setCategorias(valores);
            setSkip(0);
          }}
        />
      </Muestra>

      <Muestra titulo="Tabla con selección" className="block">
        {seleccion.size > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-md bg-primary-container px-3 py-2 text-xs text-on-primary-container">
            <span>
              {seleccion.size} {seleccion.size === 1 ? 'insumo elegido' : 'insumos elegidos'}
            </span>
            <button
              type="button"
              className="font-medium underline"
              onClick={() => setSeleccion(new Set())}
            >
              Quitar la selección
            </button>
          </div>
        )}

        <div className="rounded-xl border border-outline-variant bg-surface-container">
          <DataTable
            columnas={columnas}
            filas={pagina}
            idDe={(fila) => fila.id}
            orden={orden}
            onOrdenar={alternarOrden}
            seleccion={seleccion}
            onSeleccionar={setSeleccion}
            acciones={(fila) => (
              <IconActionGroup>
                <IconAction accion="editar" etiqueta={`Editar ${fila.nombre}`} icono={<Pencil className="size-4" />} />
                <IconAction accion="eliminar" etiqueta={`Dar de baja ${fila.nombre}`} icono={<Trash2 className="size-4" />} />
              </IconActionGroup>
            )}
            vacio={
              <EmptyState
                titulo="Nada en esa categoría"
                mensaje="Prueba con otra o vuelve a «Todo»."
              />
            }
          />

          <div className="px-3">
            <Pagination
              skip={skip}
              limit={limit}
              total={filtradas.length}
              onCambiar={(siguiente) => {
                setSkip(siguiente.skip);
                setLimit(siguiente.limit);
              }}
            />
          </div>
        </div>
      </Muestra>

      <Muestra titulo="Tabla cargando" nota="El skeleton tiene tantas columnas como la tabla: nada se mueve al llegar los datos." className="block">
        <div className="rounded-xl border border-outline-variant bg-surface-container">
          <DataTable columnas={columnas} filas={[]} idDe={(fila) => fila.id} cargando />
        </div>
      </Muestra>
    </Seccion>
  );
}
