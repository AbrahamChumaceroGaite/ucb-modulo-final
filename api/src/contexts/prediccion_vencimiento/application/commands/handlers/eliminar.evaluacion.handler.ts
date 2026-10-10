import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DomainException, LoggerService } from '@libs';
import type { IEvaluacionWriteRepository } from '../../../domain/repositories/IEvaluacionWrite.interface';
import { EliminarEvaluacionCommand } from '../eliminar.evaluacion.command';

/** Removes a review from the list. The lot itself is not touched: it lives in Spring. */
@CommandHandler(EliminarEvaluacionCommand)
export class EliminarEvaluacionHandler implements ICommandHandler<EliminarEvaluacionCommand> {
  constructor(
    @Inject('IEvaluacionWriteRepository')
    private readonly writeRepository: IEvaluacionWriteRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('EliminarEvaluacionHandler');
  }

  async execute(command: EliminarEvaluacionCommand): Promise<true | DomainException> {
    const borrada = await this.writeRepository.delete(command.id);
    if (!borrada) return DomainException.notFound('No encontramos esa evaluación.');

    this.logger.logEvent('Evaluación quitada', { id: command.id });
    return true;
  }
}
