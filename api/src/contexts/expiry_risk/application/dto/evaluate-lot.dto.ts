import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Matches, Min, ValidateIf } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'debe tener la forma AAAA-MM-DD';

/**
 * Body of `POST /lot-risk/evaluate`. Only types, signs and formats are checked
 * here; rules between fields live in the domain value objects.
 */
export class EvaluateLotDto {
  @IsUUID('all', { message: 'Elige un producto de la lista.' })
  productId!: string;

  @Matches(ISO_DATE, { message: `receivedOn ${DATE_MESSAGE}` })
  receivedOn!: string;

  @Matches(ISO_DATE, { message: `expiresOn ${DATE_MESSAGE}` })
  expiresOn!: string;

  @Matches(ISO_DATE, { message: `reviewedOn ${DATE_MESSAGE}` })
  reviewedOn!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'initialQuantity debe ser un número' })
  initialQuantity!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'remainingQuantity debe ser un número' })
  remainingQuantity!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'stockAhead debe ser un número' })
  @Min(0, { message: 'stockAhead no puede ser negativo' })
  stockAhead!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'usage7d debe ser un número' })
  @Min(0, { message: 'usage7d no puede ser negativo' })
  usage7d!: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber({}, { message: 'usage28d debe ser un número o null' })
  @Min(0, { message: 'usage28d no puede ser negativo' })
  usage28d?: number | null;
}
