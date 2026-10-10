import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { IModeloRiesgoRepository } from '../../../domain/repositories/IModeloRiesgo.interface';
import type { ModeloRiesgoResponse } from '../../types/evaluacion.types';
import { ObtenerModeloQuery } from '../obtener.modelo.query';

/**
 * The model's card: version, threshold, catalog and test metrics.
 *
 * The web shows these numbers next to the list so whoever reads a prediction
 * also sees how often the model is right and where its limits are.
 */
@QueryHandler(ObtenerModeloQuery)
export class ObtenerModeloHandler implements IQueryHandler<ObtenerModeloQuery> {
  constructor(
    @Inject('IModeloRiesgoRepository')
    private readonly modeloRepository: IModeloRiesgoRepository,
  ) {}

  async execute(): Promise<ModeloRiesgoResponse> {
    const { ficha, calendario } = this.modeloRepository.obtener();
    return {
      version: ficha.version,
      entrenadoEl: ficha.entrenadoEl,
      umbral: ficha.umbral,
      recallObjetivo: ficha.recallObjetivo,
      calendario: { anioMinimo: calendario.anioMinimo, anioMaximo: calendario.anioMaximo },
      insumos: ficha.insumos,
      metricas: ficha.metricas,
      particiones: ficha.particiones,
    };
  }
}
