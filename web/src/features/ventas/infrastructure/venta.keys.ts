import type { ParamsListado } from '@/shared/api/paginated';

/**
 * Claves de caché de ventas.
 *
 * Se declaran aquí y nadie escribe un array a mano en un hook: así
 * `invalidateQueries({ queryKey: ventaKeys.all })` alcanza de verdad a todo lo
 * de ventas, incluidas las listas con filtros que nadie recuerda.
 */
export const ventaKeys = {
  all: ['venta'] as const,
  listas: () => [...ventaKeys.all, 'lista'] as const,
  lista: (params: ParamsListado) => [...ventaKeys.listas(), params] as const,
  detalle: (id: string) => [...ventaKeys.all, 'detalle', id] as const,
};

/**
 * Lo que una venta necesita elegir: estados, productos y clientes.
 *
 * Cuelgan de `catalogo` y no de `venta` a propósito: registrar una venta
 * invalida `ventaKeys.listas()`, y si estas listas colgaran de ahí se volvería
 * a pedir la carta entera y la libreta de clientes en cada cobro — que es
 * justo el momento en que la pantalla tiene que ir rápida.
 */
export const catalogoDeVentaKeys = {
  estados: () => ['catalogo', 'estados-de-venta'] as const,
  productos: () => ['catalogo', 'productos-de-venta'] as const,
  clientes: () => ['catalogo', 'clientes-de-venta'] as const,
};
