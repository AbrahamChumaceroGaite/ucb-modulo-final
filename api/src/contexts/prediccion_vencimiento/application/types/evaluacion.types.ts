import type { NivelDeRiesgo } from '../../domain/value_objects/nivel-de-riesgo.vo';
import type { OrigenEvaluacion } from '../../domain/aggregates/evaluacion-lote.aggregate';
import type { FichaDelModelo } from '../../domain/entities/modelo-riesgo.entity';

// ==================== FILTERS ====================

export interface EvaluacionListFilters {
  search?: string;
  riesgo?: NivelDeRiesgo[];
  categoria?: string[];
  venceDesde?: string;
  venceHasta?: string;
}

// ==================== RESPONSES ====================

/**
 * What the web receives for one review. Flat on purpose: the web schema
 * validates each field with Zod at the edge (RULES §9.3), and a flat object
 * is one `z.object` with no nested shapes to keep in sync.
 */
export interface EvaluacionResponse {
  id: string;
  codigoInsumo: string;
  insumo: string;
  categoria: string;
  unidad: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  fechaRevision: string;
  cantidadInicial: number;
  cantidadRestante: number;
  stockPorDelante: number;
  consumo7d: number;
  consumo28d: number | null;
  diasParaVencer: number;
  probabilidad: number;
  umbral: number;
  nivel: NivelDeRiesgo;
  enRiesgo: boolean;
  reglaDeCobertura: boolean | null;
  diasCobertura: number | null;
  sobranteEstimado: number | null;
  versionModelo: string;
  origen: OrigenEvaluacion;
  registradaEl: string;
}

export interface ModeloRiesgoResponse {
  version: string;
  entrenadoEl: string;
  umbral: number;
  recallObjetivo: number;
  calendario: { anioMinimo: number; anioMaximo: number };
  insumos: FichaDelModelo['insumos'];
  metricas: FichaDelModelo['metricas'];
  particiones: FichaDelModelo['particiones'];
}
