'use client';

import { useColeccion } from '@/shared/api/coleccion';
import { productoDeRecetaApi } from '../infrastructure/receta.api';
import { catalogoDeRecetaKeys } from '../infrastructure/receta.keys';

/**
 * Los productos que una receta puede elegir y contra los que resuelve nombres.
 *
 * ## Por qué su clave no cuelga de `receta`
 *
 * Porque no son recetas. Guardar una receta invalida `recetaKeys.listas()`, y
 * si esta lista colgara de ahí se volvería a pedir la despensa entera cada vez
 * que alguien corrige una falta de ortografía en un paso.
 *
 * Cuelga de `catalogo` porque eso es lo que es aquí: una lista cerrada que se
 * consulta para elegir. Que la pantalla de productos tenga su propia caché de
 * lo mismo es correcto — son dos consumidores con dos contratos distintos del
 * mismo endpoint, y ninguno debe invalidar al otro.
 */
export function useProductosDeReceta() {
  const consulta = useColeccion(catalogoDeRecetaKeys.productos(), productoDeRecetaApi.listar);

  return {
    productos: consulta.data ?? [],
    cargando: consulta.isPending,
  };
}
