import type { Paginado } from '@libs';
import type { EvaluacionListFilters, EvaluacionResponse } from '../../application/types/evaluacion.types';

export interface IEvaluacionReadRepository {
  findById(id: string): Promise<EvaluacionResponse | null>;
  findAll(filtros: EvaluacionListFilters, skip: number, limit: number): Promise<Paginado<EvaluacionResponse>>;
}
