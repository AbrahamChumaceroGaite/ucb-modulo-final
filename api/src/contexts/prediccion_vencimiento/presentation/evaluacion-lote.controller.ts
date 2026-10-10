import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DomainException, desenvolver, type Paginado } from '@libs';
import { EliminarEvaluacionCommand } from '../application/commands/eliminar.evaluacion.command';
import { RegistrarEvaluacionCommand } from '../application/commands/registrar.evaluacion.command';
import { ListarEvaluacionesDto, RegistrarEvaluacionDto } from '../application/dto/evaluacion.dto';
import { ListarEvaluacionesQuery } from '../application/queries/listar.evaluaciones.query';
import { ObtenerEvaluacionQuery } from '../application/queries/obtener.evaluacion.query';
import type { EvaluacionResponse } from '../application/types/evaluacion.types';

/** An id that is not a UUID cannot exist: same answer as an unknown one. */
const ID_VALIDO = new ParseUUIDPipe({
  exceptionFactory: () => DomainException.notFound('No encontramos esa evaluación.'),
});

/**
 * `/api/v1/evaluacion-lote`. Singular, like every Spring resource (RULES §2.1
 * of the web): the web's BFF routes this path to this service.
 */
@Controller('evaluacion-lote')
export class EvaluacionLoteController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async listar(@Query() filtros: ListarEvaluacionesDto): Promise<Paginado<EvaluacionResponse>> {
    return this.queryBus.execute(new ListarEvaluacionesQuery(filtros));
  }

  @Get(':id')
  async obtener(@Param('id', ID_VALIDO) id: string): Promise<EvaluacionResponse> {
    return desenvolver(await this.queryBus.execute(new ObtenerEvaluacionQuery(id)));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registrar(@Body() dto: RegistrarEvaluacionDto): Promise<EvaluacionResponse> {
    return desenvolver(await this.commandBus.execute(new RegistrarEvaluacionCommand(dto, 'manual')));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param('id', ID_VALIDO) id: string): Promise<void> {
    desenvolver(await this.commandBus.execute(new EliminarEvaluacionCommand(id)));
  }
}
