/**
 * Los identificadores de los roles, fijados aquí.
 *
 * ## Por qué están escritos a mano
 *
 * El backend no tiene endpoint de catálogo que el frontend pueda consumir hoy
 * para llenar el selector de rol de un alta, y sin el `id` no se puede crear
 * un usuario. Así que viven aquí, en un solo sitio, con los valores reales de
 * la tabla `rol`.
 *
 * **Es deuda, y conviene decirlo:** `auth.md` es explícito en que los roles son
 * filas de la tabla y que el backend no tiene enum ni lista. Esta constante es
 * una comodidad del cliente, no una copia del modelo. En cuanto exista
 * `GET /api/v1/rol`, esto se sustituye por una consulta y el archivo
 * desaparece: por eso el resto del código pide los roles a `ROLES`, y nadie
 * escribe un UUID suelto.
 *
 * Mientras tanto hay una regla que lo mantiene honesto: el **nombre** que se
 * pinta viene siempre de `rol.nombre` de la respuesta, nunca de aquí. Si
 * alguien renombra la fila en la base, la pantalla lo refleja; lo único que
 * este archivo aporta es el `id` para poder mandarlo de vuelta.
 */
export const ROL_ID = {
  operador: '721c72fc-45bd-44d5-866b-f106400cfd7b',
  administrador: 'b4cb7db1-a6e4-43a2-94a3-462c053b67b7',
} as const;

/**
 * Lo que necesita un selector de rol: id, nombre y para qué sirve.
 *
 * La descripción no sale de la base —allí solo hay `nombre`— y es lo que
 * convierte una lista de dos palabras en una decisión informada.
 */
export const ROLES = [
  {
    clave: 'administrador' as const,
    id: ROL_ID.administrador,
    nombre: 'Administrador',
    queHace: 'Cuentas del equipo, precios, altas y bajas.',
  },
  {
    clave: 'operador' as const,
    id: ROL_ID.operador,
    nombre: 'Operador',
    queHace: 'Barra, despensa y lo que se va gastando.',
  },
] as const;

/** El rol con el que nace un alta si nadie elige otro. El de menos alcance. */
export const ROL_POR_DEFECTO = ROL_ID.operador;

/** De id a la definición. Devuelve `undefined` si el id no es de los nuestros. */
export function rolPorId(id: string) {
  return ROLES.find((rol) => rol.id === id);
}
