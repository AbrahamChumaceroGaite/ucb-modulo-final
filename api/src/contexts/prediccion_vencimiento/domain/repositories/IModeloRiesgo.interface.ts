import type { ModeloRiesgo } from '../entities/modelo-riesgo.entity';

/** Port to the trained model. One implementation reads it from disk. */
export interface IModeloRiesgoRepository {
  obtener(): ModeloRiesgo;
}
