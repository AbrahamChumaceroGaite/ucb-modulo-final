import type { Receta } from './receta.schema';

/**
 * Lo que la pantalla de recetas puede acotar hoy.
 *
 * Misma forma que en las otras dos pantallas: **todos los filtros son listas**,
 * la lista vacía es «todos», y lo que se elige viaja en la URL. No es simetría
 * por gusto — es lo que permite que `<FilterChips>` y `chipsDeLista` sirvan
 * para las tres sin una sola rama especial.
 */
export type FiltrosDeReceta = {
  /** `'activos'` y/o `'baja'`. */
  estado: readonly string[];
  /** Ids del producto que se obtiene. */
  productos: readonly string[];
};

const pasa = (elegidos: readonly string[], valor: string | null) =>
  elegidos.length === 0 || (valor !== null && elegidos.includes(valor));

/**
 * Acota una página ya cargada.
 *
 * `ObtenerRecetasRequest` solo acepta `skip`, `limit` y `search` —leído en el
 * Java—, así que esto se aplica sobre lo que llegó y el contador sigue
 * diciendo el total real. Igual que en personal y en productos, y por el mismo
 * motivo: el día que la API acepte los parámetros, se borra un archivo y no
 * una vista.
 */
export function filtrarRecetas(
  filas: readonly Receta[],
  { estado, productos }: FiltrosDeReceta,
): Receta[] {
  return filas.filter(
    (receta) =>
      pasa(estado, receta.borrado ? 'baja' : 'activos') &&
      pasa(productos, receta.idProductoObtenido),
  );
}
