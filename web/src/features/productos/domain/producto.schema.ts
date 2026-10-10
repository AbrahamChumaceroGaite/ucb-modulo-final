import { z } from 'zod';
import type { Nivel } from '@/shared/config/levels';
import { cantidad, dinero, textoRequerido } from '@/shared/lib/validation';

/**
 * Qué es un producto. Tomado de `ProductoResponse.java` del backend, campo a
 * campo, no de una documentación.
 *
 * Los tipos salen de `z.infer`: no hay una `interface` escrita a mano en
 * paralelo que pueda desincronizarse. Auditamos un proyecto donde el frontend
 * declaraba `code: string`, el backend enviaba `code: number` y los dobles de
 * prueba devolvían `'OK'`.
 */

/**
 * Las dos referencias anidadas. El backend las manda completas o en `null`,
 * y cada una tiene su forma: **no son intercambiables**.
 *
 * - `CategoriaResponse`: `{ id, nombre, esBorrable, borrado }`
 * - `UnidadResponse`: `{ id, unidad, abreviatura, esBorrable, borrado }`
 *
 * Ojo con la unidad: su nombre **no** es `nombre`, es `unidad`, y trae además
 * la `abreviatura` («g», «ml», «U») que es lo que se pinta junto a una cifra.
 * Un esquema común para las dos habría hecho que `unidad.nombre` fuera
 * `undefined` en silencio.
 *
 * ## No hay «tipo» de producto
 *
 * Hubo aquí un `tipoSchema` con «Producto» e «Insumo», un filtro, una columna,
 * un paso del formulario y un catálogo pedido a `GET /tipo`. **Nada de eso
 * existe en el backend**: no hay columna `id_tipo` en `producto`, no hay
 * `tipo` en `ProductoResponse`, no hay `idTipo` en `CrearProductoRequest` y no
 * hay `TipoControllerV1` —los únicos «tipo» del sistema son
 * `tipo_movimiento` y `tipo_descuento`, de otros contextos—.
 *
 * Me lo inventé, y el comentario de este archivo decía que estaba «tomado de
 * `ProductoResponse.java`, campo a campo». Con `USAR_MOCKS` en falso, la
 * pantalla habría pedido un endpoint inexistente y mandado un campo que el
 * validador rechaza.
 *
 * Lo que sí distingue la carta de la despensa es **`vendible`**, que existe en
 * la tabla, en el DTO y en el alta. Es esa la bandera que se usa.
 */
export const categoriaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  esBorrable: z.boolean(),
  borrado: z.boolean(),
});

export const unidadSchema = z.object({
  id: z.string(),
  unidad: z.string(),
  abreviatura: z.string(),
  esBorrable: z.boolean(),
  borrado: z.boolean(),
});

export type Categoria = z.infer<typeof categoriaSchema>;
export type Unidad = z.infer<typeof unidadSchema>;

export const productoSchema = z.object({
  // `id` es UUID en `string`. Nunca número.
  id: z.string(),
  nombre: z.string(),
  stock: z.number(),
  precio: z.number(),
  stockMinimo: z.number(),
  vendible: z.boolean(),
  unidadActual: unidadSchema.nullable(),
  categoria: categoriaSchema.nullable(),
  /**
   * De qué producto es presentación.
   *
   * En la base es `id_producto_padre` y casi siempre es nulo. Sirve para las
   * marcas de un mismo insumo: «Leche Pil» y «Leche Prolac» cuelgan las dos
   * de «Leche entera», y el stock de verdad lo lleva el padre.
   */
  idProductoPadre: z.string().nullable(),
  // Borrado lógico: el registro sigue ahí, marcado.
  borrado: z.boolean(),
});

/**
 * Lo que acepta `POST /api/v1/producto`, campo a campo desde
 * `CrearProductoRequest.java`.
 *
 * Obligatorios por `Validador.textoRequerido`: `nombre`, `idUnidadActual` e
 * `idCategoria`. `vendible` es opcional y el backend lo da por `true` si no
 * llega. `idProductoPadre` es `textoOpcional`.
 *
 * **No lleva `idTipo`.** Lo llevaba, y el validador lo habría ignorado o
 * rechazado: ver la nota de arriba.
 */
export const crearProductoSchema = z.object({
  nombre: textoRequerido(2, 'El nombre'),
  precio: dinero,
  stock: cantidad,
  stockMinimo: cantidad,
  vendible: z.boolean(),
  idUnidadActual: z.string().min(1, 'Elige una unidad'),
  idCategoria: z.string().min(1, 'Elige una categoría'),
  idProductoPadre: z.string(),
});

export type Producto = z.infer<typeof productoSchema>;
export type CrearProducto = z.infer<typeof crearProductoSchema>;

/**
 * Lo que acepta la actualización: todo opcional, porque es parcial y solo
 * viaja lo que cambió.
 *
 * Se deriva del tipo y no de un `crearProductoSchema.partial()`, porque ese
 * esquema no lo ejecutaba nadie —el formulario valida con el de alta y
 * `toPatch` decide qué campos salen—, así que era un objeto construido en cada
 * arranque para no usarse jamás.
 */
export type ActualizarProducto = Partial<CrearProducto>;

/**
 * Cómo de urgente es reponer. Es una regla de negocio, así que vive en el
 * dominio y no dentro de una tarjeta: la tarjeta pinta lo que se le dice.
 *
 * Los umbrales son relativos al mínimo de cada producto, no absolutos: dos kilos
 * de café son poco y dos kilos de canela son muchísimo.
 */
export function nivelDeStock(producto: Producto): Nivel {
  if (producto.stockMinimo <= 0) return 'suficiente';

  const proporcion = producto.stock / producto.stockMinimo;
  if (proporcion <= 1) return 'critico';
  if (proporcion <= 1.5) return 'bajo';
  return 'suficiente';
}

/**
 * El texto de la despensa, no el genérico de `shared`.
 *
 * «Hay que reponer» dice qué hacer; «Crítico» solo dice cómo de mal está. La
 * escala y el color salen de `shared/config/levels`; las palabras, de aquí,
 * que es quien sabe que esto es un insumo.
 */
export const TEXTO_NIVEL: Record<Nivel, string> = {
  critico: 'Hay que reponer',
  bajo: 'Queda poco',
  suficiente: 'Bien surtido',
};
