import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ObtenerModeloQuery } from '../application/queries/obtener.modelo.query';
import type { ModeloRiesgoResponse } from '../application/types/evaluacion.types';

/** `/api/v1/modelo-riesgo`: what the model is and how well it did on the test set. */
@Controller('modelo-riesgo')
export class ModeloRiesgoController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async obtener(): Promise<ModeloRiesgoResponse> {
    return this.queryBus.execute(new ObtenerModeloQuery());
  }
}
