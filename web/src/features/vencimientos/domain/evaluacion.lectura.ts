import type { Tone } from '@/shared/config/variants';
import { formatearCantidad, formatearPorcentaje } from '@/shared/lib/format';
import type { Evaluacion, ModeloRiesgo, NivelDeRiesgo } from './evaluacion.schema';

/**
 * Cómo se lee una evaluación, en palabras.
 *
 * Vive en el dominio y no repartido por tarjeta, tabla y ficha por la regla
 * 16.13: «alto» se pintaba igual en tres sitios o no era el mismo «alto». Aquí
 * se decide una vez el tono, el texto y la explicación, y las tres vistas
 * cuentan lo mismo (regla 8.10).
 */
export const TONO_POR_NIVEL: Record<NivelDeRiesgo, Tone> = {
  alto: 'danger',
  vigilar: 'warning',
  bajo: 'success',
};

export const TEXTO_POR_NIVEL: Record<NivelDeRiesgo, string> = {
  alto: 'Usar primero',
  vigilar: 'Vigilar',
  bajo: 'Sin riesgo',
};

/** Las categorías tal como las devuelve el modelo, escritas para una persona. */
const NOMBRE_DE_CATEGORIA: Record<string, string> = {
  lacteos: 'Lácteos',
  fiambres: 'Fiambres',
  panaderia: 'Panadería',
  frutas: 'Frutas',
  huevos: 'Huevos',
};

export const nombreDeCategoria = (categoria: string): string =>
  NOMBRE_DE_CATEGORIA[categoria] ?? categoria;

/**
 * La probabilidad para leerla de un vistazo. Por debajo del 1 % se dice
 * «menos de 1%»: un «0%» se lee como certeza, y un modelo no da certezas.
 */
export function porcentajeDeRiesgo(probabilidad: number): string {
  return probabilidad < 0.01 ? 'menos de 1%' : formatearPorcentaje(probabilidad);
}

/** «Usar primero · 74%»: lo que dicen la tarjeta, la tabla y la ficha. */
export function textoDeRiesgo(e: Evaluacion): string {
  return `${TEXTO_POR_NIVEL[e.nivel]} · ${porcentajeDeRiesgo(e.probabilidad)}`;
}

export function textoDeVencimiento(dias: number): string {
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `Vence en ${dias} días`;
}

/** «Quedan 3,8 de 5 kg»: dice más que «76%». */
export function textoDeLoQueQueda(e: Evaluacion): string {
  return `Quedan ${formatearCantidad(e.cantidadRestante)} de ${formatearCantidad(e.cantidadInicial, e.unidad)}`;
}

/**
 * Lo que diría la regla simple, con su porqué.
 *
 * Tres casos y no dos: sin consumo registrado la regla no sabe, y decir «sin
 * riesgo» ahí sería afirmar algo que nadie calculó.
 */
export function veredictoDeLaRegla(e: Evaluacion): string {
  if (e.reglaDeCobertura === null) return 'Sin consumo registrado, la regla no puede juzgar';
  return e.reglaDeCobertura
    ? 'La regla también avisa: al ritmo de la semana no se termina a tiempo'
    : 'La regla no avisa: al ritmo de la semana alcanza a terminarse';
}

/**
 * Si el modelo y la regla dicen lo mismo. `null` cuando la regla no puede
 * opinar: ni coinciden ni discrepan.
 *
 * Es el dato más útil de la ficha. Cuando discrepan es porque el modelo vio
 * algo que la regla no mira —un fin de semana, un feriado, vacaciones— o al
 * revés, y es justo ahí donde conviene que una persona mire.
 */
export function coincidenModeloYRegla(e: Evaluacion): boolean | null {
  return e.reglaDeCobertura === null ? null : e.reglaDeCobertura === e.enRiesgo;
}

/**
 * Cuántos días alcanza el lote —con los que van por delante— al ritmo de la
 * semana. El servicio topa la cobertura en 999 cuando no hubo consumo: ese
 * número no es un plazo, es «no se está usando», y se dice así.
 */
const COBERTURA_SIN_CONSUMO = 999;

export function textoDeCobertura(e: Evaluacion): string | null {
  if (e.diasCobertura === null) return null;
  if (e.diasCobertura >= COBERTURA_SIN_CONSUMO) return 'No se está usando';
  return `${formatearCantidad(e.diasCobertura)} días`;
}

/**
 * La línea de pie de la tarjeta: lo que merece una segunda mirada.
 *
 * Primero, que el modelo y la regla no coincidan, porque es donde una persona
 * aporta más. Si coinciden, el sobrante cuando lo hay. Si no hay nada que
 * añadir, nada: repetir «se termina antes de vencer» en cada tarjeta es ruido.
 */
export function notaDeLaTarjeta(e: Evaluacion): string | null {
  if (coincidenModeloYRegla(e) === false) {
    return e.enRiesgo
      ? 'La regla simple no avisa y el modelo sí: conviene mirarlo'
      : 'La regla simple avisa y el modelo no: conviene mirarlo';
  }
  if (e.sobranteEstimado !== null && e.sobranteEstimado > 0) return textoDelSobrante(e);
  return null;
}

export function textoDelSobrante(e: Evaluacion): string | null {
  if (e.sobranteEstimado === null) return null;
  if (e.sobranteEstimado <= 0) return 'Al ritmo de la semana se termina antes de vencer';
  return `Al ritmo de la semana quedarían unos ${formatearCantidad(e.sobranteEstimado, e.unidad)} al vencer`;
}

/**
 * De cada 100 avisos del modelo en prueba, cuántos fueron falsa alarma.
 *
 * Es la otra cara del recall y se dice en la pantalla: avisar de todo
 * detectaría todos los lotes y no serviría para nada.
 */
export function falsasAlarmasPorCien(modelo: ModeloRiesgo): number {
  return Math.round((1 - modelo.metricas.modelo.precision) * 100);
}
