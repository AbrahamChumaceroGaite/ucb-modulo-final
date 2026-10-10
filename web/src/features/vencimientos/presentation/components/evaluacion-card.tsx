'use client';

import { CalendarClock, Eye, Hourglass, Package, RotateCcw, Trash2 } from 'lucide-react';
import { IconAction } from '@/shared/ui/primitives';
import { EntityCard, type Vista } from '@/shared/ui/patterns';
import {
  nombreDeCategoria,
  notaDeLaTarjeta,
  textoDeLoQueQueda,
  textoDeRiesgo,
  textoDeVencimiento,
  TONO_POR_NIVEL,
} from '../../domain/evaluacion.lectura';
import type { Evaluacion } from '../../domain/evaluacion.schema';

/**
 * La tarjeta de un lote evaluado.
 *
 * Misma anatomía que las tarjetas de productos, recetas y ventas —todas salen
 * de `<EntityCard>`—. Lo que cambia es lo que se mira al barrer la lista:
 * cuánto riesgo hay, cuándo vence y cuánto queda.
 *
 * ## El riesgo va en la línea de estado, no en una insignia
 *
 * Es el sitio donde `<EntityCard>` pone el estado de todas las tarjetas, con
 * el color del tono. Se probó primero como insignia y en la rejilla tapaba la
 * categoría y cortaba el nombre del insumo: medido a 1280 px, «Jamón d…».
 *
 * ## El pie solo cuando hay algo que añadir
 *
 * Si el modelo y la regla simple no dicen lo mismo, se dice ahí: es donde vale
 * la pena que alguien mire. Si coinciden y sobraría algo al vencer, la
 * cantidad. Y si no, nada.
 *
 * ## Las tres acciones
 *
 * No hay «editar»: una evaluación es lo que el modelo dijo en una fecha.
 * El hueco del lápiz lo ocupa **revisar de nuevo**, que abre el formulario con
 * el mismo lote y la fecha de hoy. El servicio guarda una evaluación por lote:
 * la nueva reemplaza a la anterior, así que no aparecen dos tarjetas gemelas.
 */
export function EvaluacionCard({
  evaluacion,
  vista,
  onVer,
  onRevisar,
  onQuitar,
}: {
  evaluacion: Evaluacion;
  vista: Vista;
  onVer: () => void;
  onRevisar: () => void;
  onQuitar: () => void;
}) {
  const nota = notaDeLaTarjeta(evaluacion);

  return (
    <EntityCard
      categoria={nombreDeCategoria(evaluacion.categoria)}
      titulo={evaluacion.insumo}
      estado={textoDeRiesgo(evaluacion)}
      tono={TONO_POR_NIVEL[evaluacion.nivel]}
      marca={<Hourglass />}
      medio={<Hourglass className="size-5" />}
      vista={vista}
      datos={[
        { icono: <CalendarClock />, texto: textoDeVencimiento(evaluacion.diasParaVencer) },
        { icono: <Package />, texto: textoDeLoQueQueda(evaluacion) },
      ]}
      {...(nota ? { pie: <p className="text-xs text-on-surface-variant">{nota}</p> } : {})}
      acciones={
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la evaluación de ${evaluacion.insumo}`}
            icono={<Eye className="size-4" />}
            onClick={onVer}
          />
          <IconAction
            accion="editar"
            etiqueta={`Revisar de nuevo ${evaluacion.insumo}`}
            icono={<RotateCcw className="size-4" />}
            onClick={onRevisar}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Quitar de la lista ${evaluacion.insumo}`}
            icono={<Trash2 className="size-4" />}
            onClick={onQuitar}
          />
        </>
      }
    />
  );
}
