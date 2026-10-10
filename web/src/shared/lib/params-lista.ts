/**
 * Un filtro con varios valores, ida y vuelta entre la URL y la pantalla.
 *
 * ## Por qué existe
 *
 * Los filtros de chips pasaron a ser de selección múltiple, y **lo que se
 * acota vive en la URL** (regla 8.11). Eso obliga a decidir cómo se escribe
 * una lista en una cadena de consulta, y a decidirlo **una vez**: Personal y
 * Productos tenían ya la misma función de leer parámetros, y dos copias de
 * esta se habrían separado a la primera categoría con una coma en el nombre.
 *
 * ## Por qué comas y no un parámetro repetido
 *
 * `?categoria=a,b` en lugar de `?categoria=a&categoria=b`. La segunda forma es
 * más ortodoxa, pero `URLSearchParams.set` —que es lo que usan las dos
 * pantallas para reescribir la consulta— pisa el repetido, así que habría que
 * tratar estos filtros distinto del resto. Un separador mantiene una sola
 * forma de escribir en la URL.
 *
 * Los valores son **UUID e identificadores cortos** («activos», «si»), nunca
 * texto libre del usuario: por eso la coma es segura aquí. Si algún día se
 * filtra por un texto tecleado, este archivo es el que tiene que cambiar.
 */
const SEPARADOR = ',';

/** Lo que hay puesto en ese parámetro. Sin nada, la lista vacía. */
export function leerLista(params: URLSearchParams, clave: string): string[] {
  const crudo = params.get(clave);
  if (!crudo) return [];
  return crudo.split(SEPARADOR).filter(Boolean);
}

/**
 * Cómo se escribe de vuelta. `null` **borra el parámetro**: una lista vacía no
 * es `?categoria=`, es no tener el parámetro, porque si no la dirección se
 * llena de restos de filtros ya quitados.
 */
export function escribirLista(valores: readonly string[]): string | null {
  return valores.length > 0 ? valores.join(SEPARADOR) : null;
}

/** Pone o quita un valor de la lista, que es lo que hace pulsar un chip. */
export function alternar(valores: readonly string[], valor: string): string[] {
  return valores.includes(valor)
    ? valores.filter((otro) => otro !== valor)
    : [...valores, valor];
}
