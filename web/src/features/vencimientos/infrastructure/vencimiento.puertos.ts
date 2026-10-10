import type { Paginado } from '@/shared/api/paginated';
import type { ParamsDeEvaluaciones } from '../domain/evaluacion.filtros';
import type { Evaluacion, ModeloRiesgo, RegistrarEvaluacion } from '../domain/evaluacion.schema';

/**
 * Lo que la pantalla necesita del servicio de predicción, escrito como tipo.
 *
 * ## Por qué aquí hay una sola implementación
 *
 * Las otras features tienen dos —la real y la de datos falsos— porque nacieron
 * antes que su endpoint (regla 9.1.b). Esta nace con su servidor: `ml-api`
 * existe, está probado y la regla dice que los mocks «se borran con el flag»
 * el día que hay servidor. Escribir uno aquí sería escribir algo para
 * borrarlo.
 *
 * Y hay un motivo más fuerte: un mock de esta feature tendría que inventarse
 * probabilidades. Una pantalla de predicciones que enseña números escritos a
 * mano es justo lo que no puede existir, ni siquiera en desarrollo. Si el
 * servicio está caído, la pantalla lo dice.
 *
 * El puerto se mantiene igual: es lo que permite probar la vista sin red y lo
 * que dejaría cambiar de servidor sin tocar los casos de uso.
 */
export type EvaluacionApi = {
  listar: (params: ParamsDeEvaluaciones) => Promise<Paginado<Evaluacion>>;
  registrar: (valores: RegistrarEvaluacion) => Promise<Evaluacion>;
  quitar: (id: string) => Promise<void>;
};

export type ModeloRiesgoApi = {
  obtener: () => Promise<ModeloRiesgo>;
};
