import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Matches, Min, ValidateIf } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'debe tener la forma AAAA-MM-DD';

/**
 * Body of `POST /lot-risk/evaluate`: one lot typed by hand, to ask the model
 * "what if". Shape checks only (types, signs, formats). Rules that relate
 * fields to each other live in the domain value objects.
 *
 * `usage7d` is required here even though the domain accepts it missing: a
 * person filling the form knows last week's usage, and without it the
 * coverage rule cannot say anything to compare with.
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
