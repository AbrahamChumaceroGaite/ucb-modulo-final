import { toPatch } from '@/shared/lib/to-patch';
import type { ActualizarReceta, CrearReceta, Receta } from './receta.schema';

/**
 * Traducción entre la receta de la API y los valores del formulario.
 *
 * Funciones puras y sin dependencias: se prueban sin montar React ni un
 * servidor, que es justo por lo que esta capa existe.
 */

/**
 * Receta → formulario.
 *
 * Se caen dos cosas por el camino, y a propósito:
 *
 * - **Los `id` de ingredientes y pasos.** `CrearRecetaRequest` no los acepta, y
 *   en la actualización son opcionales. Mandarlos de vuelta sin necesidad solo
 *   añade superficie para equivocarse.
 * - **Lo dado de baja.** Un ingrediente con `borrado: true` sigue llegando en
 *   la respuesta —el borrado es lógico—, pero no forma parte de la receta que
 *   se está editando. Si se colara, reaparecería al guardar.
 *
 * Los pasos se ordenan por su número (`pasos`, así se llama en el DTO) antes de
 * aplanarse: el backend no promete orden en la lista, y el orden **es** el
 * significado de un paso.
 */
export function aFormulario(receta: Receta): CrearReceta {
  return {
    titulo: receta.titulo,
    cantidad: receta.cantidad,
    idProductoObtenido: receta.idProductoObtenido,
    ingredientes: receta.ingredientes
      .filter((ingrediente) => !ingrediente.borrado)
      .map((ingrediente) => ({
        idProducto: ingrediente.idProducto,
        cantidad: ingrediente.cantidad,
      })),
    pasos: [...receta.pasos]
      .filter((paso) => !paso.borrado)
      .sort((uno, otro) => uno.pasos - otro.pasos)
      .map((paso) => ({ descripcion: paso.descripcion })),
  };
}

/**
 * Formulario → actualización parcial. **Solo lo que cambió.**
 *
 * Con las listas no hay medias tintas: `ActualizarRecetaRequest` las recibe
 * enteras o no las recibe. Así que si cambió un solo ingrediente, viaja la
 * lista completa — que es lo que `toPatch` hace al comparar dos arrays.
 */
export function aActualizacion(original: Receta, valores: CrearReceta): ActualizarReceta {
  return toPatch(aFormulario(original), valores);
}
