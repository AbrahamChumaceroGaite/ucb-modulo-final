import type { ParamsListado } from '@/shared/api/paginated';

/**
 * Claves de caché de recetas.
 *
 * Se declaran aquí y nadie escribe un array a mano en un hook: así
 * `invalidateQueries({ queryKey: recetaKeys.all })` alcanza de verdad a todo lo
 * de recetas, incluidas las listas con filtros que nadie recuerda.
 *
 * **No cuelgan de `producto`.** Una receta usa productos, pero guardar una
 * receta no cambia ningún producto: meterlas en la misma rama recargaría la
 * despensa entera cada vez que se corrige una falta de ortografía en un paso.
 */
/**
 * Los productos que una receta referencia.
 *
 * Cuelgan de `catalogo` y no de `receta` a propósito: guardar una receta
 * invalida `recetaKeys.listas()`, y si esta lista colgara de ahí se volvería a
 * pedir la despensa entera cada vez que alguien corrige una falta de
 * ortografía en un paso.
 *
 * Está aquí y no escrita a mano en el hook, que es lo que decía la cabecera de
 * este archivo y lo que yo mismo incumplí al escribir `useColeccion(['catalogo',
 * 'productos-de-receta'], …)` tres carpetas más allá.
 */
export const catalogoDeRecetaKeys = {
  productos: () => ['catalogo', 'productos-de-receta'] as const,
};

export const recetaKeys = {
  all: ['receta'] as const,
  listas: () => [...recetaKeys.all, 'lista'] as const,
  lista: (params: ParamsListado) => [...recetaKeys.listas(), params] as const,
  detalle: (id: string) => [...recetaKeys.all, 'detalle', id] as const,
};
