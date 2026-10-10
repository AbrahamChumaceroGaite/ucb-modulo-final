import { toPatch } from '@/shared/lib/to-patch';
import type { ActualizarProducto, CrearProducto, Producto } from './producto.schema';

/**
 * Traducción entre el producto de la API y los valores del formulario.
 *
 * Son funciones puras y sin dependencias: se prueban sin montar React ni un
 * servidor, que es justo por lo que esta capa existe.
 */

/**
 * Producto → formulario.
 *
 * Las referencias anidadas se aplanan a su id, que es lo que el `<select>`
 * maneja y lo que la API espera de vuelta.
 */
export function aFormulario(producto: Producto): CrearProducto {
  return {
    nombre: producto.nombre,
    precio: producto.precio,
    stock: producto.stock,
    stockMinimo: producto.stockMinimo,
    vendible: producto.vendible,
    idUnidadActual: producto.unidadActual?.id ?? '',
    idCategoria: producto.categoria?.id ?? '',
    // El formulario maneja texto: «sin padre» es cadena vacía aquí y se
    // convierte a `null` al salir por el cable, en `infrastructure`.
    idProductoPadre: producto.idProductoPadre ?? '',
  };
}

/**
 * Formulario → actualización parcial. **Solo lo que cambió.**
 *
 * Mandar el registro entero en un PATCH gasta un viaje y arriesga pisar algo
 * que otra persona acaba de cambiar.
 */
export function aActualizacion(
  original: Producto,
  valores: CrearProducto,
): ActualizarProducto {
  return toPatch(aFormulario(original), valores);
}
