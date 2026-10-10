import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { paginate } from '@libs/application';
import { DomainException } from '@libs/domain';
import { LoggerService } from '@libs/infrastructure/monitoring/logger.service';
import type { RiskModel } from '../../../domain/entities/risk-model.entity';
import {
  OPEN_LOT_REPOSITORY,
  type IOpenLotRepository,
  type OpenLot,
} from '../../../domain/repositories/IOpenLotRepository.interface';
import { RISK_MODEL_REPOSITORY, type IRiskModelRepository } from '../../../domain/repositories/IRiskModelRepository.interface';
import { dayNumber, isoDate } from '../../../domain/services/iso-date';
import { LotReview } from '../../../domain/value_objects/lot-review.vo';
import type { ListLotRisksDto } from '../../dto/list-lot-risks.dto';
import { toLotRiskResponse } from '../../mappers/lot-risk.mapper';
import type { LotRiskPage, LotRiskResponse } from '../../types/lot-risk.types';
import { ListLotRisksQuery } from '../list-lot-risks.query';

/**
 * Every perishable lot still open in the inventory, scored by the model.
 *
 * Computed on each request from the movements, never stored: a stored score
 * would go stale with the first sale of the day.
 */
@QueryHandler(ListLotRisksQuery)
export class ListLotRisksHandler implements IQueryHandler<ListLotRisksQuery> {
  constructor(
    @Inject(RISK_MODEL_REPOSITORY) private readonly models: IRiskModelRepository,
    @Inject(OPEN_LOT_REPOSITORY) private readonly lots: IOpenLotRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(ListLotRisksHandler.name);
  }

  async execute({ filters }: ListLotRisksQuery): Promise<LotRiskPage> {
    const latest = await this.lots.latestDataDay();
    if (latest === null) return { ...paginate([], filters.skip, filters.limit), reviewedOn: null };

    const reviewedOn = isoDate(dayNumber(latest) + 1);
    const model = this.models.get();
    const open = await this.lots.findOpen(reviewedOn, model.productIds);

    const scored: LotRiskResponse[] = [];
    for (const lot of open) {
      const result = score(lot, model);
      if (DomainException.isDomainException(result)) {
        // A lot the rules reject is a data problem, not a reason to fail the whole list.
        this.logger.warn(`Lot ${lot.lotId} skipped: ${result.message}`);
        continue;
      }
      scored.push(result);
    }

    const visible = scored.filter((item) => matches(item, filters)).sort(byRisk);
    return { ...paginate(visible, filters.skip, filters.limit), reviewedOn };
  }
}

/** The same path a typed lot takes: domain rules first, then the model. */
function score(lot: OpenLot, model: RiskModel): LotRiskResponse | DomainException {
  const product = model.product(lot.productId);
  if (!product) return DomainException.notFound(`El producto ${lot.productId} no está en el catálogo del modelo.`);

  const review = LotReview.create(product, lot);
  if (DomainException.isDomainException(review)) return review;

  const prediction = model.predict(review);
  if (DomainException.isDomainException(prediction)) return prediction;

  return toLotRiskResponse(review, prediction, lot.lotId);
}

function matches(item: LotRiskResponse, filters: ListLotRisksDto): boolean {
  if (filters.level?.length && !filters.level.includes(item.level)) return false;
  if (filters.family?.length && !filters.family.includes(item.product.family)) return false;
  const search = filters.search?.trim().toLowerCase();
  return !search || item.product.name.toLowerCase().includes(search);
}

/** Most likely to expire first; ties go to the lot that expires sooner. */
function byRisk(a: LotRiskResponse, b: LotRiskResponse): number {
  return b.probability - a.probability || a.daysToExpiry - b.daysToExpiry;
}
