'use client';

import { useColeccion } from '@/shared/api/coleccion';
import { catalogoApi } from '../infrastructure/producto.api';
import { catalogoKeys } from '../infrastructure/producto.keys';

/**
 * Los dos catálogos que un alta de producto necesita.
 *
 * ## Por qué un solo hook y no dos archivos
 *
 * Porque **nunca se usan por separado**: el formulario necesita los dos a la
 * vez para poder pintarse, y la pantalla necesita las categorías para los
 * filtros. Dos hooks obligarían a llamarlos siempre juntos y a juntar sus dos
 * estados de carga en cada sitio.
 *
 * No es un «servicio que hace de todo»: son dos lecturas de la misma cosa
 * —las listas cerradas del inventario— pedidas juntas porque se usan juntas.
 *
 * Cada una guarda su propia entrada de caché, así que guardar un producto no
 * las recarga: sus claves cuelgan de `catalogo`, no de `producto`.
 */
export function useCatalogos() {
  const categorias = useColeccion(catalogoKeys.categorias(), catalogoApi.categorias);
  const unidades = useColeccion(catalogoKeys.unidades(), catalogoApi.unidades);

  return {
    categorias: categorias.data ?? [],
    unidades: unidades.data ?? [],
    cargando: categorias.isPending || unidades.isPending,
  };
}
