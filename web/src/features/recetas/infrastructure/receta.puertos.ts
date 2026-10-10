import type { Paginado, ParamsListado } from '@/shared/api/paginated';
import type { ActualizarReceta, CrearReceta, Receta } from '../domain/receta.schema';
import type { ReferenciaDeProducto } from '../domain/referencia-producto.schema';

/**
 * Lo que la aplicación necesita del exterior, escrito como un tipo.
 *
 * Igual que en `personal` y `productos`: dos implementaciones intercambiables
 * —la real y la de datos falsos— y una constante que elige. Sin el puerto, los
 * mocks se cuelan dentro de cada llamada y quitarlos obliga a tocar los casos
 * de uso.
 *
 * ## Por qué hay un segundo puerto para los productos
 *
 * Una receta no contiene productos: los **referencia por id**. El backend lo
 * dice así —`idProductoObtenido` e `idProducto` son cadenas sueltas, no
 * objetos—, y la pantalla necesita resolver esos ids a nombres y unidades.
 *
 * Las tres salidas posibles eran:
 *
 * 1. **Importar `features/productos`.** Prohibido, y con razón: ataría el ciclo
 *    de vida de dos pantallas que se despliegan y se rompen por separado.
 * 2. **Subir `productoSchema` a `shared`.** La regla 4.4 dice que un tipo
 *    compartido sube a `shared`, pero `Producto` no es un tipo: es un agregado
 *    con reglas de negocio —`nivelDeStock`— y `shared` no tiene dominio.
 * 3. **Declarar aquí lo que recetas necesita de un producto.** Es esta.
 *
 * `ReferenciaDeProducto` son cuatro campos de sólo lectura, no el agregado.
 * Que se parezca a parte de `Producto` no es duplicación: es el contrato
 * mínimo que esta pantalla consume del mismo endpoint. El día que productos
 * cambie una regla, esto no se entera — que es justo lo que se busca.
 */
export type ProductoDeRecetaApi = {
  /** Todos los que se pueden elegir. Lista corta y cerrada, como un catálogo. */
  listar: () => Promise<ReferenciaDeProducto[]>;
};

export type RecetaApi = {
  listar: (params: ParamsListado) => Promise<Paginado<Receta>>;
  crear: (valores: CrearReceta) => Promise<Receta>;
  actualizar: (id: string, cambios: ActualizarReceta) => Promise<Receta>;
  eliminar: (id: string) => Promise<void>;
};
