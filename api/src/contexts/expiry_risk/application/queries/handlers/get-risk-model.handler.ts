import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { ModelCard } from '../../../domain/entities/risk-model.entity';
import { RISK_MODEL_REPOSITORY, type IRiskModelRepository } from '../../../domain/repositories/IRiskModelRepository.interface';
import { GetRiskModelQuery } from '../get-risk-model.query';

/** The model card: version, threshold, products and test metrics against the baseline. */
@QueryHandler(GetRiskModelQuery)
export class GetRiskModelHandler implements IQueryHandler<GetRiskModelQuery> {
  constructor(@Inject(RISK_MODEL_REPOSITORY) private readonly models: IRiskModelRepository) {}

  async execute(): Promise<ModelCard> {
    return this.models.get().card;
  }
}
