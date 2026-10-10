'use client';

import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { IconAction, StatusDot } from '@/shared/ui/primitives';
import { DataTable, type ColumnaTabla } from '@/shared/ui/patterns';
import { formatearCantidad } from '@/shared/lib/format';
import { nombreDeCategoria, textoDeVencimiento } from '../../domain/evaluacion.lectura';
import type { Evaluacion } from '../../domain/evaluacion.schema';
import { RiesgoTag } from './riesgo-tag';

/**
 * Las mismas evaluaciones, en filas.
 *
 * Dice lo mismo que la tarjeta (regla 8.10): el riesgo con su probabilidad,
 * cuándo vence, cuánto queda y —en su propia columna— qué diría la regla
 * simple. Esa columna es la insignia «Difiere de la regla» de la tarjeta,
 * escrita entera: en una tabla se compara, y para comparar hace falta el dato.
 *
 * No se esconden nunca el insumo, el riesgo y las acciones.
 */
export function EvaluacionTabla({
  filas,
  cargando,
  onVer,
  onRevisar,
  onQuitar,
}: {
  filas: readonly Evaluacion[];
  cargando: boolean;
  onVer: (evaluacion: Evaluacion) => void;
  onRevisar: (evaluacion: Evaluacion) => void;
  onQuitar: (evaluacion: Evaluacion) => void;
}) {
  const columnas: ColumnaTabla<Evaluacion>[] = [
    {
      clave: 'insumo',
      titulo: 'Insumo',
      celda: (e) => <span className="font-medium text-on-surface">{e.insumo}</span>,
    },
    {
      clave: 'categoria',
      titulo: 'Categoría',
      clase: 'hidden md:table-cell',
      celda: (e) => nombreDeCategoria(e.categoria),
    },
    {
      clave: 'vence',
      titulo: 'Vence',
      clase: 'hidden sm:table-cell',
      celda: (e) => <span className="whitespace-nowrap">{textoDeVencimiento(e.diasParaVencer)}</span>,
    },
    {
      clave: 'queda',
      titulo: 'Queda',
      alineacion: 'derecha',
      clase: 'hidden sm:table-cell',
      celda: (e) => <span className="whitespace-nowrap">{formatearCantidad(e.cantidadRestante, e.unidad)}</span>,
    },
    {
      clave: 'riesgo',
      titulo: 'Riesgo',
      celda: (e) => <RiesgoTag evaluacion={e} />,
    },
    {
      clave: 'regla',
      titulo: 'Regla simple',
      clase: 'hidden lg:table-cell',
      celda: (e) => {
        if (e.reglaDeCobertura === null) return <StatusDot tono="neutral">Sin datos</StatusDot>;
        return e.reglaDeCobertura ? (
          <StatusDot tono="danger">Avisa</StatusDot>
        ) : (
          <StatusDot tono="success">No avisa</StatusDot>
        );
      },
    },
  ];

  return (
    <DataTable
      filas={filas}
      columnas={columnas}
      cargando={cargando}
      idDe={(e) => e.id}
      acciones={(e) => (
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la evaluación de ${e.insumo}`}
            icono={<Eye className="size-4" />}
            onClick={() => onVer(e)}
          />
          <IconAction
            accion="editar"
            etiqueta={`Revisar de nuevo ${e.insumo}`}
            icono={<RotateCcw className="size-4" />}
            onClick={() => onRevisar(e)}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Quitar de la lista ${e.insumo}`}
            icono={<Trash2 className="size-4" />}
            onClick={() => onQuitar(e)}
          />
        </>
      )}
    />
  );
}
