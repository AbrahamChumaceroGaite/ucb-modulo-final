import type { ICommand } from '@nestjs/cqrs';
import type { OrigenEvaluacion } from '../../domain/aggregates/evaluacion-lote.aggregate';
import type { RegistrarEvaluacionDto } from '../dto/evaluacion.dto';

export class RegistrarEvaluacionCommand implements ICommand {
  constructor(
    public readonly dto: RegistrarEvaluacionDto,
    public readonly origen: OrigenEvaluacion,
  ) {}
}
