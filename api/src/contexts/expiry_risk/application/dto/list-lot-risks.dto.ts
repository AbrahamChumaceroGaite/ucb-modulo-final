import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '@libs/application';
import { FAMILIES, type Family } from '../../domain/services/features';
import { RISK_LEVELS, type RiskLevel } from '../../domain/value_objects/risk-level.vo';

/** `?level=high,watch` → `['high', 'watch']`, the way the web writes multi-value filters. */
const commaList = ({ value }: { value: unknown }): string[] | undefined =>
  typeof value === 'string' && value.trim() !== ''
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : undefined;

export class ListLotRisksDto extends PaginationDto {
  @IsOptional()
  @Transform(commaList)
  @IsIn(RISK_LEVELS, { each: true, message: 'level acepta high, watch o low' })
  level?: RiskLevel[];

  @IsOptional()
  @Transform(commaList)
  @IsIn(FAMILIES, { each: true, message: `family acepta ${FAMILIES.join(', ')}` })
  family?: Family[];
}
