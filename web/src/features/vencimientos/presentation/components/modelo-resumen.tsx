'use client';

import { AlertTriangle, Target } from 'lucide-react';
import { Skeleton } from '@/shared/ui/primitives';
import { StatCard } from '@/shared/ui/patterns';
import { formatearPorcentaje } from '@/shared/lib/format';
import { falsasAlarmasPorCien } from '../../domain/evaluacion.lectura';
import type { ModeloRiesgo } from '../../domain/evaluacion.schema';

/**
 * Cuánto se puede fiar uno del modelo, al lado de sus predicciones.
 *
 * Tres números del conjunto de prueba, cada uno comparado con la regla simple
 * sobre **los mismos lotes**: así quien lee «usar primero» sabe también cuántas
 * veces acierta el que lo dice.
 *
 * - **Recall** va primero porque es la métrica que manda: lo caro es no avisar
 *   de un lote que termina en la basura.
 * - **Accuracy** va con su advertencia: como casi todos los lotes se terminan a
 *   tiempo, un sistema que nunca avisa ya acierta mucho.
 * - **Aviso con margen** es la pregunta del negocio: ¿hubo tiempo de hacer algo?
 *
 * Y una línea con los límites, que no van en una nota al pie.
 */
export function ModeloResumen({
  modelo,
  cargando,
  error,
}: {
  modelo: ModeloRiesgo | undefined;
  cargando: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-md bg-error/10 p-2 text-xs text-error">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        No se pudo leer la ficha del modelo: {error}
      </p>
    );
  }

  if (cargando || !modelo) {
    return (
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const { modelo: m, regla } = modelo.metricas;

  return (
    <section className="flex flex-col gap-2" aria-label="Qué tan bien funciona el modelo">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]">
        <StatCard
          etiqueta="Lotes que vencieron y avisó"
          valor={formatearPorcentaje(m.recall)}
          detalle={`Recall en prueba. La regla simple: ${formatearPorcentaje(regla.recall)}`}
          tono="primary"
          marca={<Target />}
        />
        <StatCard
          etiqueta="Avisó con 2 días o más"
          valor={formatearPorcentaje(m.avisoAnticipado2Dias)}
          detalle={`Tiempo para reaccionar. La regla: ${formatearPorcentaje(regla.avisoAnticipado2Dias)}`}
          tono="secondary"
        />
        <StatCard
          etiqueta="Aciertos en total"
          valor={formatearPorcentaje(m.accuracy)}
          detalle={`Accuracy. La regla: ${formatearPorcentaje(regla.accuracy)}. Engaña sola: casi ningún lote vence`}
          tono="neutral"
        />
      </div>
      <p className="text-[0.6875rem] text-on-surface-variant">
        Modelo {modelo.version}, entrenado con datos sintéticos de {modelo.insumos.length} insumos. Avisa
        desde {formatearPorcentaje(modelo.umbral)} de probabilidad, elegido para detectar al menos el{' '}
        {formatearPorcentaje(modelo.recallObjetivo)} de los lotes que vencen. Conoce el calendario de{' '}
        {modelo.calendario.anioMinimo} a {modelo.calendario.anioMaximo}; de cada 100 avisos,{' '}
        {falsasAlarmasPorCien(modelo)} son falsas alarmas.
      </p>
    </section>
  );
}
