import { z } from 'zod';
import { cantidad, textoRequerido } from '@/shared/lib/validation';

/**
 * Qué es una receta. Leído de `RecetaResponse.java`, `IngredienteRecetaResponse
 * .java` y `PasoRecetaResponse.java`, campo a campo, con los archivos abiertos
 * delante —que es la regla §9.1.c, escrita precisamente porque en productos me
 * inventé un campo y lo documenté como leído—.
 *
 * ## Lo que el backend manda, y lo que NO manda
 *
 * `RecetaResponse` trae `{ id, cantidad, titulo, idProductoObtenido, borrado,
 * ingredientes[], pasos[] }`.
 *
 * **`idProductoObtenido` es un id suelto, no un objeto.** No viene el nombre
 * del producto, ni su unidad. Lo mismo con `idProducto` de cada ingrediente.
 * Así que la pantalla resuelve esos nombres contra la lista de productos que
 * ya tiene cargada —igual que hace Productos con «presentación de»—, y cuando
 * no la tiene, enseña el id en vez de inventarse un nombre.
 *
 * Tampoco hay fechas: ni `fec_c` ni `fec_u` salen en el DTO, aunque la tabla
 * `receta` las tenga. Por eso el filtro de fecha está apagado, como en las
 * otras dos pantallas.
 */

/**
 * Un ingrediente: cuánto de qué producto.
 *
 * La cantidad va en la unidad del producto —el backend no manda unidad aquí—,
 * así que quien la pinta tiene que buscarla en el producto correspondiente.
 */
/*
 * `ingredienteSchema` y `pasoSchema` no se exportan: fuera de este archivo
 * nadie parsea un ingrediente suelto —siempre llegan dentro de una receta— y
 * exportarlos los dejaba como restos que `audit-muertos` marcó en cuanto
 * existieron. Se exportan los **tipos** que sí se usan fuera.
 */
const ingredienteSchema = z.object({
  id: z.string(),
  idProducto: z.string(),
  cantidad: z.number(),
  borrado: z.boolean(),
});

/**
 * Un paso de la preparación.
 *
 * **Ojo con `pasos`**: así se llama el campo que guarda el *número de orden* de
 * este paso —`private Integer pasos` en `PasoRecetaResponse`—. Es confuso y es
 * el nombre del contrato, así que se respeta aquí y se le pone un nombre
 * legible al salir hacia la pantalla, en el mapper. Renombrarlo en el esquema
 * habría hecho que el `parse` fallara en silencio contra el servidor real.
 */
const pasoSchema = z.object({
  id: z.string(),
  pasos: z.number().int(),
  descripcion: z.string(),
  borrado: z.boolean(),
});

export const recetaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  /** Cuánto produce una tanda, en la unidad del producto obtenido. */
  cantidad: z.number(),
  idProductoObtenido: z.string(),
  ingredientes: z.array(ingredienteSchema),
  pasos: z.array(pasoSchema),
  borrado: z.boolean(),
});

type Ingrediente = z.infer<typeof ingredienteSchema>;
export type Paso = z.infer<typeof pasoSchema>;
export type Receta = z.infer<typeof recetaSchema>;

/**
 * Lo que acepta `POST /api/v1/receta`, desde `CrearRecetaRequest.java`.
 *
 * Los cinco campos son obligatorios: `cantidad` y `titulo` por
 * `numeroRequerido`/`textoRequerido`, `idProductoObtenido` por
 * `textoRequerido`, e **ingredientes y pasos por `listaDeObjetosRequerida`** —
 * una receta sin ingredientes o sin pasos la rechaza el servidor, así que el
 * formulario la rechaza antes, con un mensaje en castellano en vez de un 400.
 *
 * Un paso **no lleva su número** al crearse: `PasoRecetaRequest` solo tiene
 * `descripcion`. El orden lo pone el backend por la posición de la lista.
 */
export const crearRecetaSchema = z.object({
  titulo: textoRequerido(2, 'El título'),
  cantidad: cantidad.refine((valor) => valor > 0, 'Una tanda tiene que producir algo'),
  idProductoObtenido: z.string().min(1, 'Elige qué se obtiene'),
  ingredientes: z
    .array(
      z.object({
        idProducto: z.string().min(1, 'Elige un producto'),
        cantidad: cantidad.refine((valor) => valor > 0, 'Pon cuánto lleva'),
      }),
    )
    .min(1, 'Una receta necesita al menos un ingrediente'),
  pasos: z
    .array(z.object({ descripcion: textoRequerido(3, 'El paso') }))
    .min(1, 'Una receta necesita al menos un paso'),
});

export type CrearReceta = z.infer<typeof crearRecetaSchema>;

/**
 * La actualización, desde `ActualizarRecetaRequest.java`: **todo opcional**.
 *
 * Las listas se mandan enteras o no se mandan: `ActualizarIngredienteRecetaRequest`
 * admite un `id` opcional para reconocer los que ya existían, pero no hay forma
 * de decir «borra este». Por eso `toPatch` compara la lista completa: si algo
 * cambió dentro, viaja toda.
 */
export type ActualizarReceta = Partial<CrearReceta>;

/**
 * Cuántas tandas salen con lo que hay en la despensa.
 *
 * Es la pregunta que se hace de verdad en una barra —«¿me da para el turno?»—
 * y es una regla de negocio, así que vive en el dominio y no dentro de una
 * tarjeta: la tarjeta pinta lo que se le dice.
 *
 * `stockPorProducto` lo arma la pantalla con los productos que ya tiene
 * cargados. Un ingrediente **cuyo producto no esté en ese mapa** no se puede
 * evaluar: devolver «0 tandas» diría que falta existencia, y lo que pasa es
 * que no lo sabemos. Por eso se devuelve `null`, y la pantalla lo dice con
 * palabras en vez de pintar un cero falso.
 *
 * Los ingredientes dados de baja no cuentan: siguen en la respuesta porque el
 * borrado es lógico, pero ya no forman parte de la receta.
 */
export function tandasPosibles(
  receta: Receta,
  stockPorProducto: ReadonlyMap<string, number>,
): number | null {
  const vigentes = receta.ingredientes.filter((ingrediente) => !ingrediente.borrado);
  if (vigentes.length === 0) return null;

  let minimo = Infinity;

  for (const ingrediente of vigentes) {
    const stock = stockPorProducto.get(ingrediente.idProducto);
    if (stock === undefined) return null;
    // Un ingrediente con cantidad cero no limita nada; dividir daría Infinity.
    if (ingrediente.cantidad <= 0) continue;

    minimo = Math.min(minimo, Math.floor(stock / ingrediente.cantidad));
  }

  return Number.isFinite(minimo) ? minimo : null;
}

/**
 * Qué ingredientes no alcanzan para una tanda.
 *
 * Separado de `tandasPosibles` porque responde a otra pregunta —«¿qué compro?»
 * frente a «¿cuánto me da?»— y porque la ficha las enseña en sitios distintos.
 * Un ingrediente que no está en el mapa no se declara faltante: no se sabe.
 */
export function ingredientesQueFaltan(
  receta: Receta,
  stockPorProducto: ReadonlyMap<string, number>,
): Ingrediente[] {
  return receta.ingredientes.filter((ingrediente) => {
    if (ingrediente.borrado) return false;
    const stock = stockPorProducto.get(ingrediente.idProducto);
    return stock !== undefined && stock < ingrediente.cantidad;
  });
}
