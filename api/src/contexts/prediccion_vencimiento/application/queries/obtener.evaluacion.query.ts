import type { IQuery } from '@nestjs/cqrs';

export class ObtenerEvaluacionQuery implements IQuery {
  constructor(public readonly id: string) {}
}
