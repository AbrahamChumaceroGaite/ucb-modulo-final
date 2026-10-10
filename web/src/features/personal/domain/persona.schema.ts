import { z } from 'zod';
import { textoRequerido } from '@/shared/lib/validation';

/**
 * La persona: el dato que comparten usuarios y clientes.
 *
 * Verificado en `PersonaResponse.java`. Ojo con dos nombres que no coinciden
 * con la tabla y que hay que respetar tal cual llegan:
 *
 * - el campo del identificador es **`idPersona`**, no `id`;
 * - el documento se llama **`carnet`** en la API y `dni` en la columna.
 *
 * Aquí manda la API, porque es lo que viaja por el cable.
 *
 * ## Por qué vive en `personal/domain` y no en cada feature
 *
 * Porque `Usuario` y `Cliente` **son** la misma persona con distinto papel: en
 * la base los dos cuelgan de `persona` por `id_persona`, y el backend los
 * agrupa en el contexto `Personal`. Duplicar el esquema en dos features sería
 * garantizar que dentro de un mes uno valide el teléfono y el otro no.
 */
export const personaSchema = z.object({
  idPersona: z.string(),
  nombres: z.string(),
  apellidos: z.string(),
  telefono: z.string().nullable(),
  carnet: z.string(),
  borrado: z.boolean(),
});

export type Persona = z.infer<typeof personaSchema>;

/**
 * Los campos de persona que se rellenan en un formulario, sean de usuario o
 * de cliente.
 *
 * Es la parte común de `CrearUsuarioRequest` y `CrearClienteRequest`: los dos
 * DTO del backend repiten exactamente estos cuatro campos. Aquí se declaran
 * una vez y cada esquema los extiende con lo suyo.
 */
export const camposDePersonaSchema = z.object({
  nombres: textoRequerido(2, 'El nombre'),
  apellidos: textoRequerido(2, 'Los apellidos'),
  /**
   * Opcional, pero si se pone tiene que ser un teléfono boliviano.
   *
   * **Sin `transform` a `null`.** El esquema describe lo que el formulario
   * maneja, y un formulario maneja texto: si aquí saliera `string | null`, el
   * valor inicial de un campo vacío sería `null` y React se quejaría de un
   * input que pasa de no controlado a controlado. La conversión de `''` a
   * `null` es cosa del cable, y vive en `infrastructure`.
   */
  telefono: z
    .string()
    .trim()
    .regex(/^[67]\d{7}$/, 'El teléfono debe tener 8 dígitos y empezar por 6 o 7')
    .or(z.literal('')),
  carnet: textoRequerido(5, 'El carnet'),
});

export type CamposDePersona = z.infer<typeof camposDePersonaSchema>;

/**
 * Nombre para mostrar. Una sola forma de componerlo en todo el producto.
 *
 * `auth.md` dice lo mismo del token: `nombreCompleto` se arma con
 * `nombre + apellidos` y **no existe como columna**. Si cada pantalla lo
 * compone a su manera, acaban difiriendo.
 */
export function nombreCompleto(persona: Persona): string {
  return `${persona.nombres} ${persona.apellidos}`.trim();
}
