import type { NivelDeRiesgo } from '../value_objects/nivel-de-riesgo.vo';
import { nivelDeRiesgo } from '../value_objects/nivel-de-riesgo.vo';
import type { BosqueLightGbm } from '../services/bosque-lightgbm';
import type { CalendarioOperativo } from '../services/calendario-operativo';
import {
  construirCaracteristicas,
  diasDeCobertura,
  reglaDeCobertura,
  type EntradaDeCaracteristicas,
} from '../services/caracteristicas';

export interface InsumoDelCatalogo {
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  vidaUtilDias: number;
}

/** Test-set results of the model and of the baseline, as exported by training. */
export interface MetricasDePrueba {
  recall: number;
  precision: number;
  accuracy: number;
  f1: number;
  prAuc?: number | null;
  avisoAnticipado2Dias: number;
}

export interface FichaDelModelo {
  version: string;
  entrenadoEl: string;
  umbral: number;
  recallObjetivo: number;
  insumos: InsumoDelCatalogo[];
  metricas: { modelo: MetricasDePrueba; regla: MetricasDePrueba };
  particiones: Record<string, { filas: number; lotes: number; positivos: number; desde: string; hasta: string }>;
}

export interface Prediccion {
  probabilidad: number;
  umbral: number;
  enRiesgo: boolean;
  nivel: NivelDeRiesgo;
  reglaDeCobertura: boolean | null;
  diasCobertura: number | null;
  sobranteEstimado: number | null;
  versionModelo: string;
}

/**
 * The trained model, as the domain sees it: what it knows (catalog, calendar)
 * and what it decides (probability and threshold).
 *
 * It is loaded once by infrastructure (`ModeloRiesgoArchivoRepository`) and is
 * immutable. Nothing here is trained or adjusted at runtime: the API only
 * reuses what `ml/src/entrenar.py` produced.
 */
export class ModeloRiesgo {
  private readonly insumos: ReadonlyMap<string, InsumoDelCatalogo>;

  constructor(
    public readonly ficha: FichaDelModelo,
    private readonly bosque: BosqueLightGbm,
    public readonly calendario: CalendarioOperativo,
  ) {
    this.insumos = new Map(ficha.insumos.map((insumo) => [insumo.codigo, insumo]));
  }

  insumo(codigo: string): InsumoDelCatalogo | undefined {
    return this.insumos.get(codigo);
  }

  predecir(entrada: EntradaDeCaracteristicas): Prediccion {
    const x = construirCaracteristicas(entrada, this.calendario);
    const probabilidad = this.bosque.probabilidad(x);
    const umbral = this.ficha.umbral;

    return {
      probabilidad,
      umbral,
      enRiesgo: probabilidad >= umbral,
      nivel: nivelDeRiesgo(probabilidad, umbral),
      reglaDeCobertura: reglaDeCobertura(x),
      diasCobertura: diasDeCobertura(x),
      sobranteEstimado: sobranteEstimado(entrada, x[0]),
      versionModelo: this.ficha.version,
    };
  }
}

/**
 * How much of this lot would be left on its expiry day at the recent pace.
 *
 * It is the arithmetic behind the coverage rule, shown so the person sees a
 * quantity ("about 2 L would be left") and not only a percentage. It is not
 * the model's output and the screen says so.
 */
function sobranteEstimado(entrada: EntradaDeCaracteristicas, diasParaVencer: number): number | null {
  if (entrada.consumo7d === null) return null;
  const consumoHastaVencer = entrada.consumo7d * (diasParaVencer + 1);
  const queda = entrada.stockPorDelante + entrada.cantidadRestante - consumoHastaVencer;
  return Math.max(0, Math.min(entrada.cantidadRestante, queda));
}
