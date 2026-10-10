import type { Paginado } from '@/shared/api/paginated';
import type { ParamsListado } from '@/shared/api/paginated';
import type { ActualizarCliente, CamposDeCliente, Cliente } from '../domain/cliente.schema';
import type { ActualizarUsuario, CamposDeUsuario, Usuario } from '../domain/usuario.schema';

/**
 * Lo que la aplicación necesita del exterior, escrito como un tipo.
 *
 * Existe para que haya **dos implementaciones intercambiables** —la real y la
 * de datos falsos— y que cambiar de una a otra sea una línea, no un `if` en
 * cada método. Sin el puerto, los mocks se cuelan dentro de cada llamada y
 * quitarlos después obliga a tocar los cuatro casos de uso.
 */
type ApiDeColeccion<T, Crear, Actualizar> = {
  listar: (params: ParamsListado) => Promise<Paginado<T>>;
  crear: (valores: Crear) => Promise<T>;
  actualizar: (id: string, cambios: Actualizar) => Promise<T>;
  eliminar: (id: string) => Promise<void>;
};

export type UsuarioApi = ApiDeColeccion<Usuario, CamposDeUsuario, ActualizarUsuario>;
export type ClienteApi = ApiDeColeccion<Cliente, CamposDeCliente, ActualizarCliente>;
