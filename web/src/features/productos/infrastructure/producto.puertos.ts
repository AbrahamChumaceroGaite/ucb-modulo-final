import type { Paginado, ParamsListado } from '@/shared/api/paginated';
import type {
  ActualizarProducto,
  Categoria,
  CrearProducto,
  Producto,
  Unidad,
} from '../domain/producto.schema';

/**
 * Lo que la aplicación necesita del exterior, escrito como un tipo.
 *
 * Igual que en `personal`: dos implementaciones intercambiables —la real y la
 * de datos falsos— y una constante que elige. Sin el puerto, los mocks se
 * cuelan dentro de cada llamada y quitarlos obliga a tocar los casos de uso.
 */
export type ProductoApi = {
  listar: (params: ParamsListado) => Promise<Paginado<Producto>>;
  crear: (valores: CrearProducto) => Promise<Producto>;
  actualizar: (id: string, cambios: ActualizarProducto) => Promise<Producto>;
  eliminar: (id: string) => Promise<void>;
};

/**
 * Los catálogos que un alta necesita para poder existir.
 *
 * **Se piden al servidor, no se escriben a mano.** Categoría y unidad tienen
 * sus propios controladores (`/categoria`, `/unidad`), así que aquí no hay
 * ninguna constante con ids —al contrario que con los roles, donde no había
 * endpoint y hubo que asumir la deuda—.
 *
 * Hubo un tercero, `tipos: () => Promise<Tipo[]>`, apuntando a `/tipo`. **Ese
 * controlador no existe**: los únicos del sistema son `/tipo-movimiento` y
 * `/tipo-descuento`, de otros contextos. Con `USAR_MOCKS` en falso habría sido
 * un 404 en cada carga de la pantalla.
 */
export type CatalogoApi = {
  categorias: () => Promise<Categoria[]>;
  unidades: () => Promise<Unidad[]>;
};
