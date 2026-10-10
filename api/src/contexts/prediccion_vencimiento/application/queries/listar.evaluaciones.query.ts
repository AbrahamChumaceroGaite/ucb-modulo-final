import type { IQuery } from '@nestjs/cqrs';
import type { ListarEvaluacionesDto } from '../dto/evaluacion.dto';

export class ListarEvaluacionesQuery implements IQuery {
  constructor(public readonly filtros: ListarEvaluacionesDto) {}
}
