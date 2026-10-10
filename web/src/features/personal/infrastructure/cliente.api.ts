import { http } from '@/shared/api/http-client';
import { paginadoSchema } from '@/shared/api/paginated';
import { USAR_MOCKS } from '@/shared/config/env';
import { clienteSchema, type CamposDeCliente } from '../domain/cliente.schema';
import { clienteApiMock } from './personal.mock';
import type { ClienteApi } from './personal.puertos';

/**
 * Llamadas a `/api/v1/cliente`. Mismo criterio que `usuario.api.ts`: los
 * campos de la persona viajan planos, como los espera `CrearClienteRequest`.
 */
const listaSchema = paginadoSchema(clienteSchema);

const cuerpoDe = (valores: Partial<CamposDeCliente>) => ({
  ...valores,
  ...(valores.telefono !== undefined
    ? { telefono: valores.telefono === '' ? null : valores.telefono }
    : {}),
});

const clienteApiReal: ClienteApi = {
  listar: (params) => http.get('/cliente', listaSchema, { ...params }),
  crear: (valores) => http.post('/cliente', cuerpoDe(valores), clienteSchema),
  actualizar: (id, cambios) => http.patch(`/cliente/${id}`, cuerpoDe(cambios), clienteSchema),
  eliminar: (id) => http.del(`/cliente/${id}`),
};

export const clienteApi: ClienteApi = USAR_MOCKS ? clienteApiMock : clienteApiReal;
