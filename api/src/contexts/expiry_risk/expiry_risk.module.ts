import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluateLotHandler } from './application/queries/handlers/evaluate-lot.handler';
import { GetRiskModelHandler } from './application/queries/handlers/get-risk-model.handler';
import { ListLotRisksHandler } from './application/queries/handlers/list-lot-risks.handler';
import { OPEN_LOT_REPOSITORY } from './domain/repositories/IOpenLotRepository.interface';
import { RISK_MODEL_REPOSITORY } from './domain/repositories/IRiskModelRepository.interface';
import { RiskModelFileRepository } from './infrastructure/model/risk-model.file.repository';
import { OpenLotPostgresRepository } from './infrastructure/persistence/open-lot.postgres.repository';
import { LotRiskController } from './presentation/lot-risk.controller';
import { RiskModelController } from './presentation/risk-model.controller';

/** Expiry risk of perishable lots. Ports are injected by token, so tests can swap the database for a fake. */
@Module({
  imports: [CqrsModule],
  controllers: [LotRiskController, RiskModelController],
  providers: [
    EvaluateLotHandler,
    ListLotRisksHandler,
    GetRiskModelHandler,
    { provide: RISK_MODEL_REPOSITORY, useClass: RiskModelFileRepository },
    { provide: OPEN_LOT_REPOSITORY, useClass: OpenLotPostgresRepository },
  ],
})
export class ExpiryRiskModule {}
