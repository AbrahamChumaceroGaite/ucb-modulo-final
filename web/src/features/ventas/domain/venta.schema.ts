import { z } from 'zod';
import { cantidad, dinero } from '@/shared/lib/validation';

/**
 * Qué es una venta. Leído de `VentaResponse.java`, `DetalleVentaResponse.java`
 * y `EstadoVentaResponse.java`, campo a campo, con los archivos abiertos
 * delante — que es la regla §9.1.c.
 *
 * ## Lo que el backend manda
 *
 * `{ id, fechaVenta, total, idUsuario, idCliente, estadoVenta, borrado,
 * detalles[] }`, y cada detalle es `{ id, idProducto, precioUnitario,
 * cantidad, subtotal, descuentoAplicado, estado, borrado }`.
 *
 * Tres asimetrías que hay que respetar y no «arreglar»:
 *
 * 1. **`estadoVenta` viene anidado** (`{ id, nombre, borrado }`), pero
 *    `idUsuario`, `idCliente` e `idProducto` vienen como **ids sueltos**. La
 *    pantalla resuelve esos nombres contra listas que pide aparte, igual que
 *    recetas; el estado no hace falta resolverlo porque ya llega entero.
 * 2. **`total` y `subtotal` los calcula el servidor.** No están en
 *    `CrearVentaRequest` ni en `DetalleVentaRequest`. El formulario los enseña
 *    para que quien cobra vea la cifra, pero **no los manda**: si el frontend
 *    mandara un total, dos redondeos distintos darían dos verdades.
 * 3. **`idCliente` es opcional** (`textoOpcional`, y la columna admite `NULL`).
 *    Una venta de mostrador no tiene cliente, y eso no es un dato que falte.
 *
 * ## La fecha
 *
 * `fechaVenta` es un `LocalDateTime` de Java: **sin zona horaria**. Con la
 * configuración por omisión de Spring Boot sale como `"2026-09-21T10:15:30"`.
 * Se guarda como texto y se formatea como hora local, que es lo que significa
 * un `LocalDateTime`: la hora del reloj de la cafetería. Convertirlo a UTC
 * sería inventarle una zona que el dato no trae.
 *
 * Es el **primer campo de fecha que el backend expone** en todo el proyecto —
 * `PersonaResponse` y `ProductoResponse` no lo hacen—, así que aquí el filtro
 * de fecha sí puede funcionar.
 */
export const estadoVentaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  borrado: z.boolean(),
});

export type EstadoVenta = z.infer<typeof estadoVentaSchema>;

const detalleVentaSchema = z.object({
  id: z.string(),
  idProducto: z.string(),
  precioUnitario: z.number(),
  cantidad: z.number(),
  /** Lo calcula el servidor: `precioUnitario * cantidad - descuentoAplicado`. */
  subtotal: z.number(),
  descuentoAplicado: z.number(),
  /**
   * Viene en la respuesta y **no se puede mandar**: `DetalleVentaRequest` no lo
   * acepta. En la tabla es `estado BOOLEAN NOT NULL DEFAULT TRUE`, y ni el DTO
   * ni el agregado dicen qué distingue. Se modela porque llega, y **no se
   * construye interfaz encima**: pintar «anulada» sobre un booleano cuyo
   * significado se adivina es exactamente lo que no se hace aquí.
   */
  estado: z.boolean(),
  borrado: z.boolean(),
});

export type DetalleVenta = z.infer<typeof detalleVentaSchema>;

export const ventaSchema = z.object({
  id: z.string(),
  /** ISO local, sin zona. Ver la nota de arriba. */
  fechaVenta: z.string(),
  total: z.number(),
  idUsuario: z.string(),
  idCliente: z.string().nullable(),
  estadoVenta: estadoVentaSchema.nullable(),
  detalles: z.array(detalleVentaSchema),
  borrado: z.boolean(),
});

export type Venta = z.infer<typeof ventaSchema>;

/**
 * Lo que acepta `POST /api/v1/venta`, desde `CrearVentaRequest.java`.
 *
 * - `idUsuario` es **requerido** y no está en este esquema a propósito: lo pone
 *   la capa de infraestructura con el id de la sesión. Un formulario que
 *   pregunta «¿quién vende?» deja registrar ventas a nombre de otro.
 * - `fechaVenta` es opcional y el backend usa `now()` si falta. No se manda:
 *   el reloj bueno es el del servidor.
 * - `idEstadoVenta` es requerido.
 * - `detalles` es `listaDeObjetosRequerida`: una venta sin líneas la rechaza el
 *   servidor, así que la rechaza antes el formulario, con un mensaje en
 *   castellano en vez de un 400.
 * - `descuentoAplicado` es opcional y el backend lo pone a cero.
 */
export const crearVentaSchema = z.object({
  idCliente: z.string(),
  idEstadoVenta: z.string().min(1, 'Elige en qué estado queda la venta'),
  detalles: z
    .array(
      z.object({
        idProducto: z.string().min(1, 'Elige un producto'),
        precioUnitario: dinero,
        cantidad: cantidad.refine((valor) => valor > 0, 'Pon cuántas unidades'),
        descuentoAplicado: dinero,
      }),
    )
    .min(1, 'Una venta necesita al menos una línea'),
});

export type CrearVenta = z.infer<typeof crearVentaSchema>;

/** La actualización, desde `ActualizarVentaRequest.java`: todo opcional. */
export type ActualizarVenta = Partial<CrearVenta>;

/**
 * Lo que costaría una línea. **Se calcula para enseñarlo, no para mandarlo.**
 *
 * El servidor guarda su propio `subtotal`, y es el que manda. Esto existe para
 * que quien está cobrando vea la cifra mientras teclea, antes de que exista
 * ninguna respuesta que leer.
 *
 * Es una regla de negocio —el descuento resta sobre el importe de la línea, no
 * sobre el precio unitario— y por eso vive en el dominio y no dentro de un
 * componente.
 */
export function subtotalDeLinea(linea: {
  precioUnitario: number;
  cantidad: number;
  descuentoAplicado: number;
}): number {
  const bruto = linea.precioUnitario * linea.cantidad;
  // Nunca negativo: un descuento mayor que la línea no es dinero que se
  // devuelve, es un descuento mal puesto.
  return Math.max(0, bruto - linea.descuentoAplicado);
}

/**
 * Lo que sumarían las líneas tecleadas.
 *
 * Mismo criterio: es el total **provisional** del formulario. El de la venta
 * guardada es `venta.total`, que lo calculó el servidor, y no se recalcula al
 * pintarlo — si los dos no coincidieran, la verdad es la del servidor y
 * taparlo con una suma local escondería el problema.
 */
export function totalProvisional(
  lineas: readonly { precioUnitario: number; cantidad: number; descuentoAplicado: number }[],
): number {
  return lineas.reduce((suma, linea) => suma + subtotalDeLinea(linea), 0);
}

/** Las líneas vigentes. El borrado es lógico: lo dado de baja sigue llegando. */
export function lineasVigentes(venta: Venta): DetalleVenta[] {
  return venta.detalles.filter((detalle) => !detalle.borrado);
}
