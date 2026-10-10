import type { ListLotRisksDto } from '../dto/list-lot-risks.dto';

export class ListLotRisksQuery {
  constructor(public readonly filters: ListLotRisksDto) {}
}
