import type { ICommand } from '@nestjs/cqrs';

export class EliminarEvaluacionCommand implements ICommand {
  constructor(public readonly id: string) {}
}
