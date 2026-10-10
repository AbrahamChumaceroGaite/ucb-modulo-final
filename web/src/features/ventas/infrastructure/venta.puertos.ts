import type { Paginado, ParamsListado } from '@/shared/api/paginated';
import type { ActualizarVenta, CrearVenta, EstadoVenta, Venta } from '../domain/venta.schema';
import type { ClienteDeVenta, ProductoDeVenta } from '../domain/referencias.schema';

/**
 * Lo que la aplicación necesita del exterior, escrito como un tipo.
 *
 * Igual que en las otras tres features: dos implementaciones intercambiables
 * —la real y la de datos falsos— y una constante que elige.
 *
 * ## `crear` recibe el vendedor aparte
 *
 * `CrearVentaRequest` exige `idUsuario`, y ese id **no sale del formulario**:
 * sale de la sesión. Va como segundo argumento y no dentro de `CrearVenta`
 * para que se vea que son dos fuentes distintas — lo que la persona teclea, y
 * lo que el sistema ya sabe.
 */
export type VentaApi = {
  listar: (params: ParamsListado) => Promise<Paginado<Venta>>;
  crear: (valores: CrearVenta, idUsuario: string) => Promise<Venta>;
  actualizar: (id: string, cambios: ActualizarVenta) => Promise<Venta>;
  eliminar: (id: string) => Promise<void>;
};

/**
 * Las tres listas que un cobro necesita para poder existir.
 *
 * Los estados tienen su propio controlador (`/estado-venta`). Productos y
 * clientes se piden a los suyos, con **esquemas mínimos propios** de esta
 * feature: ver `referencias.schema.ts` y la regla 16.21.
 */
export type CatalogoDeVentaApi = {
  estados: () => Promise<EstadoVenta[]>;
  productos: () => Promise<ProductoDeVenta[]>;
  clientes: () => Promise<ClienteDeVenta[]>;
};
