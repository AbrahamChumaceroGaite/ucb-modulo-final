import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { Paginado } from '@libs';
import type { IEvaluacionReadRepository } from '../../../domain/repositories/IEvaluacionRead.interface';
import type { EvaluacionResponse } from '../../types/evaluacion.types';
import { ListarEvaluacionesQuery } from '../listar.evaluaciones.query';

@QueryHandler(ListarEvaluacionesQuery)
export class ListarEvaluacionesHandler implements IQueryHandler<ListarEvaluacionesQuery> {
  constructor(
    @Inject('IEvaluacionReadRepository')
    private readonly readRepository: IEvaluacionReadRepository,
  ) {}

  async execute(query: ListarEvaluacionesQuery): Promise<Paginado<EvaluacionResponse>> {
    const { skip, limit, search, riesgo, categoria, venceDesde, venceHasta } = query.filtros;
    return this.readRepository.findAll({ search, riesgo, categoria, venceDesde, venceHasta }, skip, limit);
  }
}
