import { DomainException } from '@libs/domain';
import { LoggerService } from '@libs/infrastructure/monitoring/logger.service';
import { productNamed, realRiskModel, SLOW_TOMATOES } from '../../../testing/model-files';
import type { EvaluateLotDto } from '../../dto/evaluate-lot.dto';
import type { LotRiskResponse } from '../../types/lot-risk.types';
import { EvaluateLotQuery } from '../evaluate-lot.query';
import { EvaluateLotHandler } from './evaluate-lot.handler';

const handler = new EvaluateLotHandler({ get: () => realRiskModel() }, new LoggerService());
const tomato = productNamed('Tomate 1 kg');
const dto: EvaluateLotDto = { productId: tomato.productId, ...SLOW_TOMATOES, usage7d: 100 };

const run = (change: Partial<EvaluateLotDto> = {}) => handler.execute(new EvaluateLotQuery({ ...dto, ...change }));

describe('EvaluateLotHandler', () => {
  it('runs the real model on a typed lot and says it is not from the inventory', async () => {
    const result = (await run()) as LotRiskResponse;
    expect(result.lotId).toBeNull();
    expect(result.product).toEqual({ id: tomato.productId, name: 'Tomate 1 kg', family: 'produce', unit: 'g' });
    expect(result.daysToExpiry).toBe(5);
    expect(result.level).toBe('high');
  });

  it('accepts a missing 28-day average', async () => {
    const result = (await run({ usage28d: undefined })) as LotRiskResponse;
    expect(result.usage28d).toBeNull();
    expect(result.probability).toBeGreaterThan(0);
  });

  it('refuses a product the model was not trained on', async () => {
    const result = await run({ productId: '00000000-0000-4000-8000-000000000000' });
    expect(DomainException.isDomainException(result) && result.status).toBe(422);
  });

  it('passes the domain rule that failed straight through', async () => {
    const result = await run({ reviewedOn: '2026-03-10' });
    expect(DomainException.isDomainException(result) && result.message).toContain('ya venció');
  });
});
