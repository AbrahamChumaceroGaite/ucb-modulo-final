import type { Cliente } from './cliente.schema';
import type { Usuario } from './usuario.schema';

/**
 * Lo que la pantalla de personal puede acotar hoy. Vive aquí para poder
 * probarse sola.
 *
 * Son listas por la misma razón que en productos, y con la misma forma: lo
 * que se acota es igual en las dos pantallas, así que se lee igual y se
 * escribe igual en la URL.
 */
export type FiltrosDePersonal = {
  /** `'activos'` y/o `'baja'`. */
  estado: readonly string[];
  /** Ids de rol. Solo tienen sentido sobre usuarios. */
  roles: readonly string[];
};

/** Distingue las dos colecciones por lo único que no comparten: el rol. */
export function esUsuario(fila: Usuario | Cliente): fila is Usuario {
  return 'rol' in fila;
}

const pasa = (elegidos: readonly string[], valor: string | null) =>
  elegidos.length === 0 || (valor !== null && elegidos.includes(valor));

/**
 * Acota una página ya cargada.
 *
 * ## Por qué se filtra en el cliente, y por qué eso hay que decirlo
 *
 * `ObtenerUsuariosRequest` solo acepta `skip`, `limit` y `search`. El rol y el
 * estado **no pueden viajar al servidor**, así que se aplican sobre la página
 * que llegó. Con paginación de servidor eso significa que el filtro actúa
 * *dentro* de la página: el contador sigue diciendo el total real, que es lo
 * honesto, y no un total falso calculado en el navegador.
 *
 * Cuando la API acepte estos parámetros, esta función se borra y los filtros
 * se pasan a `params`. Está aparte del componente justamente para que ese día
 * sea un archivo y no una vista entera.
 *
 * El rol se ignora sobre clientes: no tienen. Filtrar por algo que una
 * colección no tiene devolvería cero resultados y parecería un fallo.
 */
export function filtrarPersonal<T extends Usuario | Cliente>(
  filas: readonly T[],
  { estado, roles }: FiltrosDePersonal,
): T[] {
  return filas.filter((fila) => {
    if (!pasa(estado, fila.borrado ? 'baja' : 'activos')) return false;
    if (roles.length > 0 && esUsuario(fila) && !roles.includes(fila.rol.id)) return false;
    return true;
  });
}
