'use client';

import { useColeccion } from '@/shared/api/coleccion';
import { catalogoDeVentaApi } from '../infrastructure/venta.api';
import { catalogoDeVentaKeys } from '../infrastructure/venta.keys';

/**
 * Las tres listas que un cobro necesita: estados, productos y clientes.
 *
 * ## Por qué un solo hook y no tres archivos
 *
 * Porque **nunca se usan por separado**: el formulario necesita las tres a la
 * vez para poder pintarse, y la pantalla necesita estados y clientes a la vez
 * para los filtros y la lista. Tres hooks obligarían a llamarlos siempre
 * juntos y a juntar sus tres estados de carga en cada sitio.
 *
 * Es el mismo criterio que `useCatalogos` en productos: no es un «servicio que
 * hace de todo», son lecturas de listas cerradas pedidas juntas porque se usan
 * juntas.
 *
 * ## Solo lo vendible, y solo los clientes activos
 *
 * El filtrado se hace aquí y no en la pantalla porque es la misma decisión en
 * los tres sitios donde se usan —el desplegable del formulario, los chips y la
 * resolución de nombres—, y repetirla tres veces es como se separan.
 *
 * Ojo: **para resolver nombres se devuelven todos**, incluidos los clientes
 * dados de baja. Una venta antigua de un cliente que ya no está tiene que
 * seguir enseñando su nombre; lo que no puede es ofrecerse para una venta
 * nueva. Son dos listas distintas y por eso salen las dos.
 */
export function useCatalogosDeVenta() {
  const estados = useColeccion(catalogoDeVentaKeys.estados(), catalogoDeVentaApi.estados);
  const productos = useColeccion(catalogoDeVentaKeys.productos(), catalogoDeVentaApi.productos);
  const clientes = useColeccion(catalogoDeVentaKeys.clientes(), catalogoDeVentaApi.clientes);

  const todosLosClientes = clientes.data ?? [];
  const todosLosProductos = productos.data ?? [];

  return {
    estados: estados.data ?? [],
    /** Todos, para resolver el nombre de una venta antigua. */
    clientes: todosLosClientes,
    /** Los que se pueden elegir hoy en un cobro nuevo. */
    clientesElegibles: todosLosClientes.filter((cliente) => !cliente.borrado),
    productos: todosLosProductos,
    productosElegibles: todosLosProductos.filter((producto) => producto.vendible),
    cargando: estados.isPending || productos.isPending || clientes.isPending,
  };
}
