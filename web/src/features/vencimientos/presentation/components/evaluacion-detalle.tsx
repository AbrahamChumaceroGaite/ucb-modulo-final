'use client';

import { AlertTriangle, Scale } from 'lucide-react';
import { ResumenDato, ResumenGrupo } from '@/shared/ui/patterns';
import { formatearCantidad, formatearFecha, formatearPorcentaje } from '@/shared/lib/format';
import {
  coincidenModeloYRegla,
  nombreDeCategoria,
  porcentajeDeRiesgo,
  textoDeCobertura,
  textoDeVencimiento,
  textoDelSobrante,
  veredictoDeLaRegla,
} from '../../domain/evaluacion.lectura';
import type { Evaluacion } from '../../domain/evaluacion.schema';
import { RiesgoTag } from './riesgo-tag';

/**
 * La ficha de una evaluación: qué dijo el modelo, qué diría la regla y con
 * qué datos.
 *
 * Va en el panel que empuja, como las demás fichas: quien revisa riesgos
 * suele ir de un lote al siguiente, y así la lista sigue a la vista.
 *
 * ## El orden es el de la pregunta que se hace la persona
 *
 * 1. **¿Qué hago?** La respuesta del modelo, arriba y en una frase.
 * 2. **¿Por qué?** La comparación con la regla simple y la cuenta del
 *    sobrante, que es lo que una persona puede comprobar con el kardex.
 * 3. **¿Con qué datos?** El lote tal como se evaluó.
 * 4. **¿Cuánto me fío?** La versión del modelo y sus límites.
 */
export function EvaluacionDetalle({ evaluacion }: { evaluacion: Evaluacion }) {
  const coinciden = coincidenModeloYRegla(evaluacion);
  const sobrante = textoDelSobrante(evaluacion);
  const unidad = evaluacion.unidad;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <RiesgoTag evaluacion={evaluacion} />
        <span className="text-xs text-on-surface-variant">
          {textoDeVencimiento(evaluacion.diasParaVencer)} · {formatearFecha(evaluacion.fechaVencimiento)}
        </span>
      </div>

      <p className="text-sm text-on-surface">
        {evaluacion.enRiesgo
          ? 'El modelo cree que este lote puede vencer con saldo. Conviene usarlo antes que los demás o preparar algo que lo gaste.'
          : 'El modelo cree que este lote se termina a tiempo con el ritmo de consumo actual.'}
      </p>

      {coinciden === false && (
        <p role="status" className="flex items-start gap-2 rounded-md bg-warning/10 p-2 text-xs text-on-surface">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            El modelo y la regla simple no dicen lo mismo. Suele pasar cuando vienen días con poco
            movimiento (fin de semana, feriado o vacaciones) que la regla no tiene en cuenta. Vale la
            pena mirarlo.
          </span>
        </p>
      )}

      <ResumenGrupo titulo="Por qué">
        <ResumenDato etiqueta="Probabilidad de vencer con saldo">
          {porcentajeDeRiesgo(evaluacion.probabilidad)}
        </ResumenDato>
        <ResumenDato etiqueta="Desde cuánto avisa el modelo">
          {formatearPorcentaje(evaluacion.umbral)}
        </ResumenDato>
        <ResumenDato etiqueta="Días que alcanza">
          {textoDeCobertura(evaluacion)}
        </ResumenDato>
      </ResumenGrupo>

      <p className="flex items-start gap-2 text-xs text-on-surface-variant">
        <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          {veredictoDeLaRegla(evaluacion)}.{sobrante && ` ${sobrante}.`}
        </span>
      </p>

      <ResumenGrupo titulo="El lote, tal como se evaluó">
        <ResumenDato etiqueta="Insumo">
          {evaluacion.insumo} · {nombreDeCategoria(evaluacion.categoria)}
        </ResumenDato>
        <ResumenDato etiqueta="Entró">{formatearFecha(evaluacion.fechaIngreso)}</ResumenDato>
        <ResumenDato etiqueta="Revisado">{formatearFecha(evaluacion.fechaRevision)}</ResumenDato>
        <ResumenDato etiqueta="Se compró">{formatearCantidad(evaluacion.cantidadInicial, unidad)}</ResumenDato>
        <ResumenDato etiqueta="Quedaba">{formatearCantidad(evaluacion.cantidadRestante, unidad)}</ResumenDato>
        <ResumenDato etiqueta="Por delante en la fila">
          {formatearCantidad(evaluacion.stockPorDelante, unidad)}
        </ResumenDato>
        <ResumenDato etiqueta="Consumo diario, 7 días">
          {formatearCantidad(evaluacion.consumo7d, unidad)}
        </ResumenDato>
        <ResumenDato etiqueta="Consumo diario, 28 días">
          {evaluacion.consumo28d === null ? null : formatearCantidad(evaluacion.consumo28d, unidad)}
        </ResumenDato>
      </ResumenGrupo>

      <p className="text-[0.6875rem] text-on-surface-variant">
        Modelo {evaluacion.versionModelo} · {evaluacion.origen === 'inventario' ? 'Del inventario' : 'Evaluado a mano'} ·{' '}
        {formatearFecha(evaluacion.registradaEl)}. La probabilidad es una estimación, no una
        certeza: el modelo solo conoce los insumos y el calendario con los que se entrenó.
      </p>
    </div>
  );
}
