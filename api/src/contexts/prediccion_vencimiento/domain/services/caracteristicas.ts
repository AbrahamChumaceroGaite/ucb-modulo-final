import type { CalendarioOperativo } from './calendario-operativo';
import { diaDe, diaDeLaSemana } from './fecha';

/**
 * Raw inputs of one lot review → model features.
 *
 * Line-by-line port of `ml/src/caracteristicas.py`. The order of the
 * operations is the same on purpose: both sides use IEEE-754 doubles, so the
 * same operations in the same order give the same bits, and a split
 * threshold can never be crossed by a rounding difference. The parity test
 * (`caracteristicas.spec.ts`) checks it against 400+ rows exported by Python.
 *
 * Unknown values are `NaN`, which is what LightGBM saw in training.
 */
export interface EntradaDeCaracteristicas {
  categoria: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  fechaRevision: string;
  cantidadInicial: number;
  cantidadRestante: number;
  stockPorDelante: number;
  consumo7d: number | null;
  consumo28d: number | null;
}

export const COBERTURA_MAXIMA = 999;

export const VARIABLES = [
  'dias_para_vencer',
  'edad_dias',
  'vida_util_dias',
  'porcentaje_restante',
  'consumo_7d',
  'consumo_28d',
  'tendencia_consumo',
  'dias_cobertura',
  'holgura_dias',
  'fraccion_por_delante',
  'proporcion_clases_restante',
  'proporcion_clases_7d',
  'dia_semana',
  'cat_lacteos',
  'cat_fiambres',
  'cat_panaderia',
  'cat_frutas',
  'cat_huevos',
] as const;

export const CATEGORIAS = ['lacteos', 'fiambres', 'panaderia', 'frutas', 'huevos'] as const;

const INDICE_COBERTURA = VARIABLES.indexOf('dias_cobertura');
const INDICE_HOLGURA = VARIABLES.indexOf('holgura_dias');

export function construirCaracteristicas(
  e: EntradaDeCaracteristicas,
  calendario: CalendarioOperativo,
): number[] {
  const ingreso = diaDe(e.fechaIngreso);
  const vence = diaDe(e.fechaVencimiento);
  const revision = diaDe(e.fechaRevision);

  const diasParaVencer = vence - revision;
  const edad = revision - ingreso;
  const vidaUtil = vence - ingreso;

  const restante = e.cantidadRestante;
  const porDelante = e.stockPorDelante;
  const c7 = e.consumo7d ?? Number.NaN;
  const c28 = e.consumo28d ?? Number.NaN;

  const porcentajeRestante = restante / e.cantidadInicial;

  const tendencia =
    Number.isNaN(c28) || c28 === 0 || Number.isNaN(c7) ? Number.NaN : c7 / c28;

  let cobertura: number;
  if (Number.isNaN(c7)) cobertura = Number.NaN;
  else if (c7 <= 0) cobertura = COBERTURA_MAXIMA;
  else cobertura = Math.min((porDelante + restante) / c7, COBERTURA_MAXIMA);

  const holgura = Number.isNaN(cobertura) ? Number.NaN : diasParaVencer + 1 - cobertura;

  const totalCola = porDelante + restante;
  const fraccionPorDelante = totalCola > 0 ? porDelante / totalCola : 0;

  const clasesRestante = calendario.proporcionDeClases(revision, vence);
  const clases7d = calendario.proporcionDeClases(revision - 7, revision - 1);

  const categorias = CATEGORIAS.map((categoria) => (e.categoria === categoria ? 1 : 0));

  return [
    diasParaVencer,
    edad,
    vidaUtil,
    porcentajeRestante,
    c7,
    c28,
    tendencia,
    cobertura,
    holgura,
    fraccionPorDelante,
    clasesRestante,
    clases7d,
    diaDeLaSemana(revision),
    ...categorias,
  ];
}

/** Days the lot and the lots ahead of it last at the recent pace. */
export function diasDeCobertura(caracteristicas: readonly number[]): number | null {
  const valor = caracteristicas[INDICE_COBERTURA];
  return Number.isNaN(valor) ? null : valor;
}

/**
 * The baseline: flag the lot if, at the recent pace, it will not be used up
 * before it expires. Without consumption data it cannot judge: `null`, not
 * `false` — "I don't know" is not "no risk".
 */
export function reglaDeCobertura(caracteristicas: readonly number[]): boolean | null {
  const holgura = caracteristicas[INDICE_HOLGURA];
  return Number.isNaN(holgura) ? null : holgura < 0;
}
