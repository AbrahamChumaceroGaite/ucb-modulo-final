import { http } from '@/shared/api/http-client';
import { paginadoSchema } from '@/shared/api/paginated';
import { USAR_MOCKS } from '@/shared/config/env';
import { estadoVentaSchema, ventaSchema, type CrearVenta } from '../domain/venta.schema';
import {
  clienteDeVentaSchema,
  productoDeVentaSchema,
} from '../domain/referencias.schema';
import { catalogoDeVentaApiMock, ventaApiMock } from './venta.mock';
import type { CatalogoDeVentaApi, VentaApi } from './venta.puertos';

/**
 * Llamadas a `/api/v1/venta`. Ruta en **singular**, como la declara
 * `VentaControllerV1`.
 *
 * Ojo con la del catálogo de estados: es **`/estado-venta`, en kebab**, no
 * `/estadoventa` ni `/estado_venta`. Las rutas de este backend no siguen una
 * sola convención, así que cada una se copia del `@RequestMapping` y no se
 * deduce.
 *
 * ## Lo que se traduce en el borde
 *
 * - **`idUsuario` se añade aquí**, con el id de la sesión. No sale del
 *   formulario: una venta la hace quien tiene la sesión abierta.
 * - **`idCliente` vacío sale como `null`.** Es `textoOpcional` en el backend y
 *   la columna admite `NULL`: «venta de mostrador» y «no me lo mandes» no son
 *   lo mismo, y aquí es lo primero.
 * - **No se manda `total` ni `subtotal`.** Los calcula el servidor; mandarlos
 *   sería ofrecer una segunda verdad que puede no coincidir.
 * - **No se manda `fechaVenta`.** `CrearVentaRequest` usa `now()` si falta, y
 *   el reloj bueno es el del servidor, no el del portátil de la barra.
 *
 * ## El verbo de actualizar
 *
 * `VentaControllerV1` declara `@PutMapping("/{id}")`, igual que los otros seis
 * controladores, y la instrucción del proyecto dice PATCH. Aquí se manda
 * PATCH, que es lo que dice la regla, y el conflicto está anotado en SPECS con
 * riesgo alto y en la regla 16.23. No lo resuelvo por mi cuenta.
 */
const listaSchema = paginadoSchema(ventaSchema);

const cuerpoDe = (valores: Partial<CrearVenta>, idUsuario?: string) => ({
  ...valores,
  ...(idUsuario ? { idUsuario } : {}),
  ...(valores.idCliente !== undefined
    ? { idCliente: valores.idCliente === '' ? null : valores.idCliente }
    : {}),
});

const ventaApiReal: VentaApi = {
  listar: (params) => http.get('/venta', listaSchema, { ...params }),
  crear: (valores, idUsuario) => http.post('/venta', cuerpoDe(valores, idUsuario), ventaSchema),
  actualizar: (id, cambios) => http.patch(`/venta/${id}`, cuerpoDe(cambios), ventaSchema),
  eliminar: (id) => http.del(`/venta/${id}`),
};

/**
 * Las tres listas que un cobro necesita.
 *
 * Se piden con `limit` alto y sin búsqueda: son listas cortas y cerradas, y
 * paginarlas en un desplegable solo escondería opciones. Productos y clientes
 * se parsean con **esquemas mínimos propios** de esta feature, no con los
 * agregados de las otras (regla 16.21).
 */
const LIMITE_CATALOGO = 200;

const catalogoDeVentaApiReal: CatalogoDeVentaApi = {
  estados: () =>
    http
      .get('/estado-venta', paginadoSchema(estadoVentaSchema), { limit: LIMITE_CATALOGO })
      .then((pagina) => pagina.data),
  productos: () =>
    http
      .get('/producto', paginadoSchema(productoDeVentaSchema), { limit: LIMITE_CATALOGO })
      .then((pagina) => pagina.data),
  clientes: () =>
    http
      .get('/cliente', paginadoSchema(clienteDeVentaSchema), { limit: LIMITE_CATALOGO })
      .then((pagina) => pagina.data),
};

/**
 * Las dos únicas líneas que cambian el día que haya servidor.
 *
 * No hay un `if` por método: el puerto tiene dos implementaciones y se elige
 * una. Al conectar el backend se borran estas constantes, el `import` del mock
 * y el archivo de datos falsos; el resto del código no se entera.
 */
export const ventaApi: VentaApi = USAR_MOCKS ? ventaApiMock : ventaApiReal;

export const catalogoDeVentaApi: CatalogoDeVentaApi = USAR_MOCKS
  ? catalogoDeVentaApiMock
  : catalogoDeVentaApiReal;
