import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** List parameters: `skip`, `limit` and `search`. */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'skip debe ser un entero' })
  @Min(0, { message: 'skip no puede ser negativo' })
  skip: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(50, { message: 'limit no puede pasar de 50' })
  limit: number = 10;

  @IsOptional()
  @IsString({ message: 'search debe ser un texto' })
  @MaxLength(100, { message: 'search no puede pasar de 100 caracteres' })
  search?: string;
}

export interface Page<T> {
  data: T[];
  skip: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function paginate<T>(items: readonly T[], skip: number, limit: number): Page<T> {
  return {
    data: items.slice(skip, skip + limit),
    skip,
    limit,
    total: items.length,
    hasMore: skip + limit < items.length,
  };
}
