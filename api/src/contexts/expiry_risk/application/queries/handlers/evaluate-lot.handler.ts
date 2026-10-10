import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { DomainException } from '@libs/domain';
import { LoggerService } from '@libs/infrastructure/monitoring/logger.service';
import { RISK_MODEL_REPOSITORY, type IRiskModelRepository } from '../../../domain/repositories/IRiskModelRepository.interface';
import { LotReview } from '../../../domain/value_objects/lot-review.vo';
import { toLotRiskResponse } from '../../mappers/lot-risk.mapper';
import type { LotRiskResponse } from '../../types/lot-risk.types';
import { EvaluateLotQuery } from '../evaluate-lot.query';

/**
 * Validates a lot typed by hand and runs the real model on it.
 *
 * Order matters: the product first (the model only knows the products it was
 * trained on), then the domain rules, then inference.
 */
@QueryHandler(EvaluateLotQuery)
export class EvaluateLotHandler implements IQueryHandler<EvaluateLotQuery> {
  constructor(
    @Inject(RISK_MODEL_REPOSITORY) private readonly models: IRiskModelRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(EvaluateLotHandler.name);
  }

  async execute({ dto }: EvaluateLotQuery): Promise<LotRiskResponse | DomainException> {
    const model = this.models.get();

    const product = model.product(dto.productId);
    if (!product) {
      return DomainException.unprocessable(
        'El modelo no conoce ese producto. Solo puede evaluar los perecederos con los que se entrenó.',
      );
    }

    const review = LotReview.create(product, { ...dto, usage28d: dto.usage28d ?? null });
    if (DomainException.isDomainException(review)) return review;

    const prediction = model.predict(review);
    if (DomainException.isDomainException(prediction)) return prediction;

    this.logger.logEvent('Manual evaluation', {
      product: product.name,
      probability: Number(prediction.probability.toFixed(4)),
      level: prediction.level,
    });
    return toLotRiskResponse(review, prediction, null);
  }
}
