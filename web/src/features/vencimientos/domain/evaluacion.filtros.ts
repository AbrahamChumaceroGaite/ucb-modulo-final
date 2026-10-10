import type { ParamsListado } from '@/shared/api/paginated';
import { escribirLista } from '@/shared/lib/params-lista';

/**
 * Lo que la pantalla de vencimientos puede acotar.
 *
 * Misma forma que las otras pantallas —listas, la lista vacía es «todos» y
 * todo viaja en la URL— con una diferencia que importa: **aquí el filtro se
 * aplica en el servidor.** `ListarEvaluacionesDto` acepta `riesgo`,
 * `categoria`, `venceDesde` y `venceHasta`, así que el contador y el paginador
 * hablan del total filtrado, no de una página recortada. Es lo que las otras
 * cuatro pantallas no pueden hacer y anotan como limitación (§16.11).
 */
export type FiltrosDeEvaluacion = {
  /** `alto`, `vigilar` y/o `bajo`. */
  riesgo: readonly string[];
  /** Categorías del modelo: `lacteos`, `frutas`… */
  categoria: readonly string[];
  /** `AAAA-MM-DD` o cadena vacía. Fecha de **vencimiento**, ambos extremos incluidos. */
  desde: string;
  hasta: string;
};

export type ParamsDeEvaluaciones = ParamsListado & {
  riesgo?: string;
  categoria?: string;
  venceDesde?: string;
  venceHasta?: string;
};

/**
 * Lo que va a la API. Lo vacío no viaja: un `?riesgo=` sin valor sería un 400,
 * y uno que no se manda es «todos».
 */
export function aParametrosDeApi(
  base: ParamsListado,
  { riesgo, categoria, desde, hasta }: FiltrosDeEvaluacion,
): ParamsDeEvaluaciones {
  const params: ParamsDeEvaluaciones = { ...base };
  const riesgos = escribirLista(riesgo);
  const categorias = escribirLista(categoria);
  if (riesgos) params.riesgo = riesgos;
  if (categorias) params.categoria = categorias;
  if (desde) params.venceDesde = desde;
  if (hasta) params.venceHasta = hasta;
  return params;
}
