import { LoggerService } from '@libs/infrastructure/monitoring/logger.service';
import { FakeOpenLotRepository, openLot } from '../../../testing/fake-open-lots';
import { BUSY_MILK, realRiskModel, SLOW_TOMATOES } from '../../../testing/model-files';
import { ListLotRisksDto } from '../../dto/list-lot-risks.dto';
import { ListLotRisksQuery } from '../list-lot-risks.query';
import { ListLotRisksHandler } from './list-lot-risks.handler';

const model = realRiskModel();

function filters(change: Partial<ListLotRisksDto> = {}): ListLotRisksDto {
  return Object.assign(new ListLotRisksDto(), change);
}

function setup(lots = [openLot('tomato-1', 'Tomate 1 kg', SLOW_TOMATOES), openLot('milk-1', 'Leche Pil 1 L', BUSY_MILK)], latest?: string | null) {
  const repository = new FakeOpenLotRepository(lots, latest);
  const logger = new LoggerService();
  const warn = jest.spyOn(logger, 'warn');
  const handler = new ListLotRisksHandler({ get: () => model }, repository, logger);
  return { handler, repository, warn, run: (dto = filters()) => handler.execute(new ListLotRisksQuery(dto)) };
}

describe('ListLotRisksHandler', () => {
  it('reviews the morning after the last recorded movement, for the products the model knows', async () => {
    const { run, repository } = setup();
    const page = await run();
    expect(page.reviewedOn).toBe('2026-03-04');
    expect(repository.requests).toEqual([{ reviewedOn: '2026-03-04', productIds: model.productIds }]);
  });

  it('puts the lot most likely to expire first', async () => {
    const page = await (setup().run());
    expect(page.data.map((item) => item.lotId)).toEqual(['tomato-1', 'milk-1']);
    expect(page.data[0].level).toBe('high');
    expect(page.data[0].probability).toBeGreaterThan(page.data[1].probability);
  });

  it('filters by level, family and product name', async () => {
    const { run } = setup();
    expect((await run(filters({ level: ['high'] }))).data.map((item) => item.lotId)).toEqual(['tomato-1']);
    expect((await run(filters({ family: ['dairy'] }))).data.map((item) => item.lotId)).toEqual(['milk-1']);
    expect((await run(filters({ search: '  LECHE ' }))).data.map((item) => item.lotId)).toEqual(['milk-1']);
  });

  it('paginates after filtering and sorting', async () => {
    const page = await setup().run(filters({ skip: 1, limit: 1 }));
    expect(page).toMatchObject({ total: 2, skip: 1, limit: 1, hasMore: false });
    expect(page.data.map((item) => item.lotId)).toEqual(['milk-1']);
  });

  it('skips a lot the domain rejects instead of failing the whole list', async () => {
    const broken = openLot('broken-1', 'Tomate 1 kg', { ...SLOW_TOMATOES, remainingQuantity: 5000 });
    const { run, warn } = setup([broken, openLot('milk-1', 'Leche Pil 1 L', BUSY_MILK)]);
    const page = await run();
    expect(page.data.map((item) => item.lotId)).toEqual(['milk-1']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('broken-1'));
  });

  it('returns an empty page when the database has no movements', async () => {
    const page = await setup([], null).run();
    expect(page).toEqual({ data: [], skip: 0, limit: 10, total: 0, hasMore: false, reviewedOn: null });
  });
});
