import { z } from 'zod';
import { camposDePersonaSchema, personaSchema } from './persona.schema';

/**
 * Un cliente es una persona que compra. No tiene cuenta, ni correo, ni rol.
 *
 * Verificado en `ClienteResponse.java`: `{ id, persona, borrado }`. Es
 * literalmente `UsuarioResponse` menos el acceso, y por eso comparte la misma
 * `personaSchema` en vez de declarar los suyos.
 */
export const clienteSchema = z.object({
  id: z.string(),
  persona: personaSchema,
  borrado: z.boolean(),
});

export type Cliente = z.infer<typeof clienteSchema>;

/**
 * Lo que rellena el formulario de cliente: **solo** los campos de persona.
 *
 * No se extiende con nada. Si mañana un cliente gana un campo propio, se añade
 * aquí y el formulario de usuario no se entera, que es justo el motivo de que
 * la parte común esté en `camposDePersonaSchema` y no copiada en los dos.
 */
export const camposDeClienteSchema = camposDePersonaSchema;

export type CamposDeCliente = z.infer<typeof camposDeClienteSchema>;

export type ActualizarCliente = Partial<CamposDeCliente>;
