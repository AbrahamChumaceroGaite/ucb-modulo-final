import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRiskModelQuery } from '../application/queries/get-risk-model.query';
import type { ModelCard } from '../application/types/lot-risk.types';

@Controller('risk-model')
export class RiskModelController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async card(): Promise<ModelCard> {
    return this.queryBus.execute(new GetRiskModelQuery());
  }
}
