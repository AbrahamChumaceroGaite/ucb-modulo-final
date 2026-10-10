import { z } from 'zod';

/**
 * Lo que una receta necesita saber de un producto. **Nada más.**
 *
 * Leído del mismo `ProductoResponse.java` que usa la feature de productos,
 * pero quedándose con cuatro campos: el id para casar la referencia, el nombre
 * para poder enseñarla, la abreviatura de la unidad para poner «18 g» en vez
 * de «18», y el stock para contestar «¿me da para el turno?».
 *
 * ## Esto no es duplicar `productoSchema`
 *
 * Es el contrato mínimo que esta pantalla consume. `Producto` es un agregado
 * con reglas —`nivelDeStock`, umbrales, vendibilidad— que aquí no pintan nada;
 * arrastrarlo entero ataría las dos pantallas, y compartirlo por `shared`
 * metería dominio en una capa que no tiene dominio (regla 4.4).
 *
 * `.loose()` no se usa a propósito: el esquema **ignora** los campos que no
 * declara, que es lo que permite que productos añada uno sin romper esto.
 */
export const referenciaDeProductoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  stock: z.number(),
  unidadActual: z
    .object({ abreviatura: z.string() })
    .nullable(),
});

export type ReferenciaDeProducto = z.infer<typeof referenciaDeProductoSchema>;

/** «18 g», o «18» si el producto no trae unidad. La cifra sola engaña. */
export function conUnidad(cantidad: number, producto: ReferenciaDeProducto | undefined): string {
  const abreviatura = producto?.unidadActual?.abreviatura;
  return abreviatura ? `${cantidad} ${abreviatura}` : String(cantidad);
}
