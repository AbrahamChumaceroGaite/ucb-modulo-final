import type { EvaluacionLoteAggregate } from '../aggregates/evaluacion-lote.aggregate';

export interface IEvaluacionWriteRepository {
  /** Stores the review, replacing any earlier review of the same lot. */
  save(evaluacion: EvaluacionLoteAggregate): Promise<EvaluacionLoteAggregate>;
  /** `false` if there was nothing with that id. */
  delete(id: string): Promise<boolean>;
}
