import { z } from 'zod';

/**
 * Lo que una venta necesita saber de otras cosas. **Nada más.**
 *
 * `VentaResponse` manda `idUsuario`, `idCliente` e `idProducto` como cadenas
 * sueltas, así que la pantalla tiene que resolverlos para poder enseñar
 * nombres en vez de UUID.
 *
 * ## Esto no es duplicar los esquemas de productos ni de personal
 *
 * Es el contrato mínimo que esta pantalla consume, y es la misma decisión —con
 * el mismo motivo— que `recetas/domain/referencia-producto.schema.ts` (regla
 * 16.21): importar otra feature está prohibido, y subir sus agregados a
 * `shared` metería dominio en una capa que no lo tiene.
 *
 * Los esquemas **ignoran** los campos que no declaran, que es lo que permite
 * que productos o personal añadan uno sin romper esto.
 */

/** De un producto: para elegirlo y para poner su precio por omisión. */
export const productoDeVentaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  precio: z.number(),
  /** Solo lo vendible entra en una venta; el filtrado es de quien lo pide. */
  vendible: z.boolean(),
});

export type ProductoDeVenta = z.infer<typeof productoDeVentaSchema>;

/**
 * De un cliente: su nombre, que vive en la persona anidada.
 *
 * `ClienteResponse` trae `{ id, persona: { nombres, apellidos, … }, borrado }`.
 * Aquí solo se parsea lo que hace falta para pintar una opción.
 */
export const clienteDeVentaSchema = z.object({
  id: z.string(),
  persona: z.object({
    nombres: z.string(),
    apellidos: z.string(),
  }),
  borrado: z.boolean(),
});

export type ClienteDeVenta = z.infer<typeof clienteDeVentaSchema>;

/** «Nombres Apellidos». En la base nunca están juntos. */
export function nombreDeCliente(cliente: ClienteDeVenta): string {
  return `${cliente.persona.nombres} ${cliente.persona.apellidos}`.trim();
}
