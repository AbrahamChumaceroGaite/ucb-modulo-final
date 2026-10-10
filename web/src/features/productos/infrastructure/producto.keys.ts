import type { ParamsListado } from '@/shared/api/paginated';

/**
 * Claves de caché de productos.
 *
 * Se declaran aquí y nadie escribe un array a mano en un hook: así
 * `invalidateQueries({ queryKey: productoKeys.all })` alcanza de verdad a todo
 * lo de productos, incluidas las listas con filtros que nadie recuerda.
 */
/**
 * Los catálogos tienen su propia rama: son listas cortas que casi nunca
 * cambian, así que no deben recargarse cada vez que se guarda un producto.
 */
export const catalogoKeys = {
  all: ['catalogo'] as const,
  categorias: () => ['catalogo', 'categorias'] as const,
  unidades: () => ['catalogo', 'unidades'] as const,
};

export const productoKeys = {
  all: ['producto'] as const,
  listas: () => [...productoKeys.all, 'lista'] as const,
  lista: (params: ParamsListado) => [...productoKeys.listas(), params] as const,
  detalle: (id: string) => [...productoKeys.all, 'detalle', id] as const,
};
