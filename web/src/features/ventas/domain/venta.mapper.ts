import { toPatch } from '@/shared/lib/to-patch';
import type { ActualizarVenta, CrearVenta, Venta } from './venta.schema';

/**
 * Traducción entre la venta de la API y los valores del formulario.
 *
 * Funciones puras y sin dependencias: se prueban sin montar React ni un
 * servidor, que es justo por lo que esta capa existe.
 */

/**
 * Venta → formulario.
 *
 * Se caen cuatro cosas por el camino, todas a propósito:
 *
 * - **`total` y `subtotal`**, porque los calcula el servidor y el formulario no
 *   los manda. Enviarlos sería ofrecer una segunda verdad.
 * - **`fechaVenta`**, porque `CrearVentaRequest` la toma de `now()` si falta y
 *   el reloj bueno es el del servidor.
 * - **`idUsuario`**, porque lo pone la sesión, no el formulario.
 * - **Los `id` de las líneas y lo dado de baja.** Una línea con
 *   `borrado: true` sigue llegando en la respuesta —el borrado es lógico— pero
 *   ya no forma parte de la venta; si se colara, reaparecería al guardar.
 *
 * `idCliente` pasa de `null` a cadena vacía: el `<select>` maneja texto, y la
 * vuelta la hace `infrastructure`. Es la misma traducción que hace productos
 * con «presentación de», y por el mismo motivo — «sin cliente» y «no me lo
 * mandes» no son lo mismo.
 */
export function aFormulario(venta: Venta): CrearVenta {
  return {
    idCliente: venta.idCliente ?? '',
    idEstadoVenta: venta.estadoVenta?.id ?? '',
    detalles: venta.detalles
      .filter((detalle) => !detalle.borrado)
      .map((detalle) => ({
        idProducto: detalle.idProducto,
        precioUnitario: detalle.precioUnitario,
        cantidad: detalle.cantidad,
        descuentoAplicado: detalle.descuentoAplicado,
      })),
  };
}

/**
 * Formulario → actualización parcial. **Solo lo que cambió.**
 *
 * Con las líneas no hay medias tintas: `ActualizarVentaRequest` las recibe
 * enteras o no las recibe. Así que si cambió una sola, viaja la lista completa
 * — que es lo que `toPatch` hace al comparar dos arrays de objetos.
 */
export function aActualizacion(original: Venta, valores: CrearVenta): ActualizarVenta {
  return toPatch(aFormulario(original), valores);
}
