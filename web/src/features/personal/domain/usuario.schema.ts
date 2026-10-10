import { z } from 'zod';
import { contrasena, correo } from '@/shared/lib/validation';
import { camposDePersonaSchema, personaSchema } from './persona.schema';

/**
 * Un usuario es una **cuenta de acceso** colgada de una persona.
 *
 * Verificado en `UsuarioResponse.java`: `{ id, correo, persona, rol, borrado }`.
 * La persona va anidada porque así la manda el backend, y el rol también: el
 * nombre que se pinta sale siempre de ahí, nunca de la constante de ids.
 */
const rolSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  borrado: z.boolean(),
});

export const usuarioSchema = z.object({
  id: z.string(),
  correo: z.string(),
  persona: personaSchema,
  rol: rolSchema,
  borrado: z.boolean(),
});

export type Usuario = z.infer<typeof usuarioSchema>;

/**
 * Lo que rellena el formulario de usuario: la persona más lo suyo.
 *
 * ## La contraseña, y por qué es opcional
 *
 * En un alta hace falta; al editar, dejarla en blanco significa «no la toques»
 * —`ActualizarUsuarioRequest` la acepta nula—. Por eso el esquema la admite
 * vacía y es la pantalla quien exige que exista al crear: la misma forma sirve
 * para los dos casos sin inventar un segundo esquema que se desincronice.
 */
export const camposDeUsuarioSchema = camposDePersonaSchema.extend({
  correo,
  contrasena: contrasena.or(z.literal('')),
  idRol: z.string().min(1, 'Elige un rol'),
});

export type CamposDeUsuario = z.infer<typeof camposDeUsuarioSchema>;

/** El alta exige contraseña. Es la única diferencia con la edición. */
export const crearUsuarioSchema = camposDeUsuarioSchema.extend({ contrasena });

/**
 * Lo que viaja en un PATCH. Todo opcional: solo va lo que cambió.
 *
 * Se deriva del tipo y no de un `.partial()` ejecutado, para no construir un
 * esquema que nadie valida —el formulario valida con el de alta y `toPatch`
 * decide qué campos salen—.
 */
export type ActualizarUsuario = Partial<CamposDeUsuario>;
