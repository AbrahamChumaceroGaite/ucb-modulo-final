import { http } from '@/shared/api/http-client';
import { paginadoSchema } from '@/shared/api/paginated';
import { USAR_MOCKS } from '@/shared/config/env';
import { usuarioSchema, type CamposDeUsuario } from '../domain/usuario.schema';
import { usuarioApiMock } from './personal.mock';
import type { UsuarioApi } from './personal.puertos';

/**
 * Llamadas a `/api/v1/usuario`. Ruta en **singular**, como la declara
 * `UsuarioControllerV1`.
 *
 * ## El cuerpo que espera el backend no es el del formulario
 *
 * `CrearUsuarioRequest` recibe los campos de la persona **planos** —`nombres`,
 * `apellidos`, `telefono`, `carnet`— junto al correo, la contraseña y el rol.
 * No recibe un objeto `persona`. Esa traducción vive aquí, en el borde, y no
 * en el formulario ni en el caso de uso.
 *
 * `telefono` sale como `null` cuando está vacío: en el formulario es texto,
 * en la base es una columna que admite nulo.
 */
const listaSchema = paginadoSchema(usuarioSchema);

const cuerpoDe = (valores: Partial<CamposDeUsuario>) => ({
  ...valores,
  ...(valores.telefono !== undefined
    ? { telefono: valores.telefono === '' ? null : valores.telefono }
    : {}),
});

const usuarioApiReal: UsuarioApi = {
  listar: (params) => http.get('/usuario', listaSchema, { ...params }),
  crear: (valores) => http.post('/usuario', cuerpoDe(valores), usuarioSchema),
  actualizar: (id, cambios) => http.patch(`/usuario/${id}`, cuerpoDe(cambios), usuarioSchema),
  eliminar: (id) => http.del(`/usuario/${id}`),
};

/**
 * La única línea que cambia el día que haya servidor.
 *
 * No hay un `if` por método: el puerto tiene dos implementaciones y se elige
 * una. Cuando el backend esté en pie, se borra la constante y el `import` del
 * mock, y el resto del código no se entera.
 */
export const usuarioApi: UsuarioApi = USAR_MOCKS ? usuarioApiMock : usuarioApiReal;
