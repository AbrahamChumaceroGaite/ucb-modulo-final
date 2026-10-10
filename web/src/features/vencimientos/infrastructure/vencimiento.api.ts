import { http } from '@/shared/api/http-client';
import { paginadoSchema } from '@/shared/api/paginated';
import { evaluacionSchema, modeloRiesgoSchema } from '../domain/evaluacion.schema';
import type { EvaluacionApi, ModeloRiesgoApi } from './vencimiento.puertos';

/**
 * Llamadas a `/api/v1/evaluacion-lote` y `/api/v1/modelo-riesgo`.
 *
 * Van por el mismo BFF que todo lo demás (`/api/proxy/...`). Es el BFF quien
 * sabe que estos dos recursos los sirve `ml-api` y no Spring
 * (`RECURSOS_DE_PREDICCION` en `env.ts`); para esta feature es una API más.
 *
 * Los filtros viajan al servidor: `ListarEvaluacionesDto` los acepta, así que
 * el total y el paginador hablan de lo filtrado.
 */
const listaSchema = paginadoSchema(evaluacionSchema);

export const evaluacionApi: EvaluacionApi = {
  listar: (params) => http.get('/evaluacion-lote', listaSchema, { ...params }),
  registrar: (valores) => http.post('/evaluacion-lote', valores, evaluacionSchema),
  quitar: (id) => http.del(`/evaluacion-lote/${id}`),
};

export const modeloRiesgoApi: ModeloRiesgoApi = {
  obtener: () => http.get('/modelo-riesgo', modeloRiesgoSchema),
};
