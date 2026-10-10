import type { EvaluacionLoteAggregate } from '../../domain/aggregates/evaluacion-lote.aggregate';
import type { EvaluacionResponse } from '../types/evaluacion.types';

/** Aggregate → the flat DTO the web validates. */
export function aRespuesta(evaluacion: EvaluacionLoteAggregate): EvaluacionResponse {
  const fechas = evaluacion.fechas.value;
  const cantidades = evaluacion.cantidades.value;
  const consumo = evaluacion.consumo.value;
  const p = evaluacion.prediccion;

  return {
    id: evaluacion.id,
    codigoInsumo: evaluacion.insumo.codigo,
    insumo: evaluacion.insumo.nombre,
    categoria: evaluacion.insumo.categoria,
    unidad: evaluacion.insumo.unidad,
    fechaIngreso: fechas.ingreso,
    fechaVencimiento: fechas.vencimiento,
    fechaRevision: fechas.revision,
    cantidadInicial: cantidades.inicial,
    cantidadRestante: cantidades.restante,
    stockPorDelante: cantidades.porDelante,
    consumo7d: consumo.promedio7d,
    consumo28d: consumo.promedio28d,
    diasParaVencer: evaluacion.fechas.diasParaVencer,
    probabilidad: p.probabilidad,
    umbral: p.umbral,
    nivel: p.nivel,
    enRiesgo: p.enRiesgo,
    reglaDeCobertura: p.reglaDeCobertura,
    diasCobertura: p.diasCobertura,
    sobranteEstimado: p.sobranteEstimado,
    versionModelo: p.versionModelo,
    origen: evaluacion.origen,
    registradaEl: evaluacion.registradaEl.toISOString(),
  };
}
