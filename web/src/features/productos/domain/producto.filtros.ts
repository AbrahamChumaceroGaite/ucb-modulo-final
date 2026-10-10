import type { Producto } from './producto.schema';

/**
 * Lo que la pantalla de productos puede acotar hoy.
 *
 * **Todos los filtros son listas**, incluidos los que parecen de dos valores.
 * No es simetría por gusto: «Activos» y «Dados de baja» son dos opciones que
 * el usuario puede querer a la vez —y entonces la lista vacía y la lista con
 * las dos significan lo mismo, que es correcto—. Tratar unos como texto y
 * otros como lista obligaría a dos formas de leer la URL y a dos formas de
 * pintar los chips.
 *
 * La lista vacía es «todos». Nunca es «ninguno»: un filtro que al quitarlo
 * todo deja la lista en blanco se lee como un fallo de carga.
 */
export type FiltrosDeProducto = {
  /** `'activos'` y/o `'baja'`. */
  estado: readonly string[];
  /** Ids de categoría. */
  categorias: readonly string[];
  /** `'si'` (está en la carta) y/o `'no'` (solo despensa). */
  vendible: readonly string[];
};

/** Un filtro vacío no acota; con valores, la fila tiene que estar en ellos. */
const pasa = (elegidos: readonly string[], valor: string | null) =>
  elegidos.length === 0 || (valor !== null && elegidos.includes(valor));

/**
 * Acota una página ya cargada.
 *
 * `ObtenerProductosRequest` solo acepta `skip`, `limit` y `search` —lo leí en
 * el Java—, así que estado, categoría y vendibilidad **no pueden viajar al
 * servidor** y se aplican sobre la página que llegó. El contador sigue
 * diciendo el total real, que es lo honesto.
 *
 * Está fuera del componente para poder probarse sin montar una pantalla, y
 * para que el día que la API acepte estos parámetros se borre un archivo y no
 * una vista.
 */
export function filtrarProductos(
  filas: readonly Producto[],
  { estado, categorias, vendible }: FiltrosDeProducto,
): Producto[] {
  return filas.filter(
    (producto) =>
      pasa(estado, producto.borrado ? 'baja' : 'activos') &&
      pasa(categorias, producto.categoria?.id ?? null) &&
      pasa(vendible, producto.vendible ? 'si' : 'no'),
  );
}
