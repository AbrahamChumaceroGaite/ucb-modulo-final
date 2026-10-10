import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { unwrap } from '@libs/presentation';
import { EvaluateLotDto } from '../application/dto/evaluate-lot.dto';
import { ListLotRisksDto } from '../application/dto/list-lot-risks.dto';
import { EvaluateLotQuery } from '../application/queries/evaluate-lot.query';
import { ListLotRisksQuery } from '../application/queries/list-lot-risks.query';
import type { LotRiskPage, LotRiskResponse } from '../application/types/lot-risk.types';

@Controller('lot-risk')
export class LotRiskController {
  constructor(private readonly queryBus: QueryBus) {}

  /** Open perishable lots in the inventory, most likely to expire first. */
  @Get()
  async list(@Query() filters: ListLotRisksDto): Promise<LotRiskPage> {
    return this.queryBus.execute(new ListLotRisksQuery(filters));
  }

  /** A lot typed by hand. POST because it carries a body; it stores nothing. */
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluate(@Body() dto: EvaluateLotDto): Promise<LotRiskResponse> {
    return unwrap(await this.queryBus.execute(new EvaluateLotQuery(dto)));
  }
}
