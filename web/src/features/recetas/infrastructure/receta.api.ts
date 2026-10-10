import { http } from '@/shared/api/http-client';
import { paginadoSchema } from '@/shared/api/paginated';
import { USAR_MOCKS } from '@/shared/config/env';
import { recetaSchema } from '../domain/receta.schema';
import { referenciaDeProductoSchema } from '../domain/referencia-producto.schema';
import { productoDeRecetaApiMock, recetaApiMock } from './receta.mock';
import type { ProductoDeRecetaApi, RecetaApi } from './receta.puertos';

/**
 * Llamadas a `/api/v1/receta`. Ruta en **singular**, como la declara
 * `RecetaControllerV1`.
 *
 * ## El verbo de actualizar: un conflicto que no me toca resolver a mí
 *
 * `RecetaControllerV1` declara `@PutMapping("/{id}")`, y **los otros cinco
 * controladores también** —producto, usuario, cliente, categoría y unidad—.
 * La instrucción de este proyecto es explícita: solo GET, POST, PATCH y
 * DELETE, «no PUT porque se harán actualizaciones parciales».
 *
 * Las dos cosas no pueden ser ciertas a la vez, así que aquí se manda `PATCH`,
 * que es lo que dice la regla del proyecto, y **queda anotado que hoy el
 * servidor respondería 405** en esta llamada y en las equivalentes de
 * productos y personal. No lo tapo con un mock ni añado un `put` al cliente
 * HTTP por mi cuenta: es una decisión del dueño del backend.
 *
 * Cuando se decida, se cambia en un sitio por adaptador. Está en SPECS, en
 * «Sin cubrir», con riesgo alto.
 *
 * ## Lo que se traduce en el borde
 *
 * Nada. Los nombres del formulario son los mismos que los de
 * `CrearRecetaRequest` a propósito, y las listas viajan tal cual: un
 * ingrediente es `{ idProducto, cantidad }` y un paso es `{ descripcion }`,
 * sin número — el orden lo pone la posición en la lista.
 */
const listaSchema = paginadoSchema(recetaSchema);

const recetaApiReal: RecetaApi = {
  listar: (params) => http.get('/receta', listaSchema, { ...params }),
  crear: (valores) => http.post('/receta', valores, recetaSchema),
  actualizar: (id, cambios) => http.patch(`/receta/${id}`, cambios, recetaSchema),
  eliminar: (id) => http.del(`/receta/${id}`),
};

/**
 * Los productos que una receta puede referenciar.
 *
 * Mismo endpoint que usa la pantalla de productos, **otro esquema**: aquí solo
 * se parsean los cuatro campos que una receta necesita (ver
 * `referencia-producto.schema.ts`). Se pide con `limit` alto y sin búsqueda,
 * como un catálogo: paginar un desplegable solo esconde opciones.
 */
const LIMITE_CATALOGO = 200;

const productoDeRecetaApiReal: ProductoDeRecetaApi = {
  listar: () =>
    http
      .get('/producto', paginadoSchema(referenciaDeProductoSchema), { limit: LIMITE_CATALOGO })
      .then((pagina) => pagina.data),
};

/**
 * Las dos únicas líneas que cambian el día que haya servidor.
 *
 * No hay un `if` por método: el puerto tiene dos implementaciones y se elige
 * una. Al conectar el backend se borran estas constantes, el `import` del mock
 * y el archivo de datos falsos; el resto del código no se entera.
 */
export const recetaApi: RecetaApi = USAR_MOCKS ? recetaApiMock : recetaApiReal;

export const productoDeRecetaApi: ProductoDeRecetaApi = USAR_MOCKS
  ? productoDeRecetaApiMock
  : productoDeRecetaApiReal;
