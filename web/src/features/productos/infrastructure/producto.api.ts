import { http } from '@/shared/api/http-client';
import { paginadoSchema } from '@/shared/api/paginated';
import { USAR_MOCKS } from '@/shared/config/env';
import {
  categoriaSchema,
  productoSchema,
  unidadSchema,
  type CrearProducto,
} from '../domain/producto.schema';
import { catalogoApiMock, productoApiMock } from './producto.mock';
import type { CatalogoApi, ProductoApi } from './producto.puertos';

/**
 * Llamadas a `/api/v1/producto`. Ruta en **singular**, como la declara
 * `ProductoControllerV1`.
 *
 * ## Lo que se traduce en el borde
 *
 * `idProductoPadre` es opcional en el backend (`Validador.textoOpcional`). En
 * el formulario es texto, así que la cadena vacía **sale como `null`**: es la
 * diferencia entre «no tiene padre» y «no me lo mandes», y aquí es lo primero.
 *
 * El resto viaja tal cual: los nombres del formulario son los mismos que los
 * de `CrearProductoRequest`, a propósito.
 */
const listaSchema = paginadoSchema(productoSchema);

const cuerpoDe = (valores: Partial<CrearProducto>) => ({
  ...valores,
  ...(valores.idProductoPadre !== undefined
    ? { idProductoPadre: valores.idProductoPadre === '' ? null : valores.idProductoPadre }
    : {}),
});

const productoApiReal: ProductoApi = {
  listar: (params) => http.get('/producto', listaSchema, { ...params }),
  crear: (valores) => http.post('/producto', cuerpoDe(valores), productoSchema),
  actualizar: (id, cambios) => http.patch(`/producto/${id}`, cuerpoDe(cambios), productoSchema),
  eliminar: (id) => http.del(`/producto/${id}`),
};

/**
 * Los catálogos **se piden**, no se escriben a mano.
 *
 * `/categoria` y `/unidad` tienen sus propios controladores, así que aquí no
 * hay ninguna constante con ids. Es la diferencia con los roles: allí no había
 * endpoint y hubo que asumir la deuda; aquí lo hay y no hay excusa.
 *
 * Había un tercero pidiendo `/tipo`, que **no existe en el backend**. No falló
 * nunca porque `USAR_MOCKS` lo tapaba: un endpoint inventado solo se nota el
 * día que se apagan los datos falsos.
 *
 * Se piden con `limit` alto y sin búsqueda: son listas cortas y cerradas, y
 * paginarlas en un desplegable solo escondería opciones.
 */
const LIMITE_CATALOGO = 200;

const catalogoApiReal: CatalogoApi = {
  categorias: () =>
    http
      .get('/categoria', paginadoSchema(categoriaSchema), { limit: LIMITE_CATALOGO })
      .then((pagina) => pagina.data),
  unidades: () =>
    http
      .get('/unidad', paginadoSchema(unidadSchema), { limit: LIMITE_CATALOGO })
      .then((pagina) => pagina.data),
};

/**
 * Las dos únicas líneas que cambian el día que haya servidor.
 *
 * No hay un `if` por método: el puerto tiene dos implementaciones y se elige
 * una. Al conectar el backend se borran estas constantes, el `import` del mock
 * y el archivo de datos falsos; el resto del código no se entera.
 */
export const productoApi: ProductoApi = USAR_MOCKS ? productoApiMock : productoApiReal;
export const catalogoApi: CatalogoApi = USAR_MOCKS ? catalogoApiMock : catalogoApiReal;
