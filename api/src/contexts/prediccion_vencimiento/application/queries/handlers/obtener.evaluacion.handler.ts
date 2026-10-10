import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { DomainException } from '@libs';
import type { IEvaluacionReadRepository } from '../../../domain/repositories/IEvaluacionRead.interface';
import type { EvaluacionResponse } from '../../types/evaluacion.types';
import { ObtenerEvaluacionQuery } from '../obtener.evaluacion.query';

@QueryHandler(ObtenerEvaluacionQuery)
export class ObtenerEvaluacionHandler implements IQueryHandler<ObtenerEvaluacionQuery> {
  constructor(
    @Inject('IEvaluacionReadRepository')
    private readonly readRepository: IEvaluacionReadRepository,
  ) {}

  async execute(query: ObtenerEvaluacionQuery): Promise<EvaluacionResponse | DomainException> {
    const evaluacion = await this.readRepository.findById(query.id);
    return evaluacion ?? DomainException.notFound('No encontramos esa evaluación.');
  }
}
