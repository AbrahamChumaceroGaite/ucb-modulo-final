import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginacionDto } from '@libs';
import { NIVELES_DE_RIESGO, type NivelDeRiesgo } from '../../domain/value_objects/nivel-de-riesgo.vo';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MENSAJE_FECHA = 'debe tener la forma AAAA-MM-DD';

/**
 * Body of `POST /evaluacion-lote`: the raw data of one lot review.
 *
 * Shape checks only (types, signs, formats). Rules that relate fields to each
 * other —expiry after entry, remaining not above bought— live in the domain
 * value objects, because they are business rules, not transport.
 */
export class RegistrarEvaluacionDto {
  @IsString({ message: 'codigoInsumo debe ser un texto' })
  @IsNotEmpty({ message: 'Elige el insumo' })
  @MaxLength(20, { message: 'codigoInsumo es demasiado largo' })
  codigoInsumo!: string;

  @Matches(FECHA, { message: `fechaIngreso ${MENSAJE_FECHA}` })
  fechaIngreso!: string;

  @Matches(FECHA, { message: `fechaVencimiento ${MENSAJE_FECHA}` })
  fechaVencimiento!: string;

  @Matches(FECHA, { message: `fechaRevision ${MENSAJE_FECHA}` })
  fechaRevision!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'cantidadInicial debe ser un número' })
  cantidadInicial!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'cantidadRestante debe ser un número' })
  cantidadRestante!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'stockPorDelante debe ser un número' })
  @Min(0, { message: 'stockPorDelante no puede ser negativo' })
  stockPorDelante!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'consumo7d debe ser un número' })
  @Min(0, { message: 'consumo7d no puede ser negativo' })
  consumo7d!: number;

  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @Type(() => Number)
  @IsNumber({}, { message: 'consumo28d debe ser un número o null' })
  @Min(0, { message: 'consumo28d no puede ser negativo' })
  consumo28d?: number | null;
}

/** `?riesgo=alto,vigilar` → `['alto', 'vigilar']`, as `params-lista.ts` writes it in the web. */
const lista = ({ value }: { value: unknown }): string[] | undefined =>
  typeof value === 'string' && value.trim() !== ''
    ? value.split(',').map((parte) => parte.trim()).filter(Boolean)
    : undefined;

export class ListarEvaluacionesDto extends PaginacionDto {
  @IsOptional()
  @Transform(lista)
  @IsIn(NIVELES_DE_RIESGO, { each: true, message: 'riesgo acepta alto, vigilar o bajo' })
  riesgo?: NivelDeRiesgo[];

  @IsOptional()
  @Transform(lista)
  @IsString({ each: true, message: 'categoria debe ser una lista de textos' })
  categoria?: string[];

  @IsOptional()
  @Matches(FECHA, { message: `venceDesde ${MENSAJE_FECHA}` })
  venceDesde?: string;

  @IsOptional()
  @Matches(FECHA, { message: `venceHasta ${MENSAJE_FECHA}` })
  venceHasta?: string;
}
