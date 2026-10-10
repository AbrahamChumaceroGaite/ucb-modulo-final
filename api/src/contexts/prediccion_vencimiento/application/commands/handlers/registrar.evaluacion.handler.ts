import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DomainException, LoggerService } from '@libs';
import { EvaluacionLoteAggregate } from '../../../domain/aggregates/evaluacion-lote.aggregate';
import type { IEvaluacionWriteRepository } from '../../../domain/repositories/IEvaluacionWrite.interface';
import type { IModeloRiesgoRepository } from '../../../domain/repositories/IModeloRiesgo.interface';
import { diaDe, textoDe } from '../../../domain/services/fecha';
import { aRespuesta } from '../../mappers/evaluacion.respuesta';
import type { EvaluacionResponse } from '../../types/evaluacion.types';
import { RegistrarEvaluacionCommand } from '../registrar.evaluacion.command';

/**
 * Validates a lot review, runs the real model on it and stores the result.
 *
 * Order matters: catalog and calendar first (cheap, and they decide whether
 * the model can say anything at all), then the domain rules, then inference.
 * Nothing reaches the model that it was not trained to see.
 */
@CommandHandler(RegistrarEvaluacionCommand)
export class RegistrarEvaluacionHandler implements ICommandHandler<RegistrarEvaluacionCommand> {
  constructor(
    @Inject('IEvaluacionWriteRepository')
    private readonly writeRepository: IEvaluacionWriteRepository,
    @Inject('IModeloRiesgoRepository')
    private readonly modeloRepository: IModeloRiesgoRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('RegistrarEvaluacionHandler');
  }

  async execute(command: RegistrarEvaluacionCommand): Promise<EvaluacionResponse | DomainException> {
    const { dto, origen } = command;
    const modelo = this.modeloRepository.obtener();

    const insumo = modelo.insumo(dto.codigoInsumo);
    if (!insumo) {
      return DomainException.unprocessable(
        `El modelo no conoce el insumo «${dto.codigoInsumo}». Solo puede evaluar los insumos con los que se entrenó.`,
      );
    }

    const datos = {
      insumo,
      fechaIngreso: dto.fechaIngreso,
      fechaVencimiento: dto.fechaVencimiento,
      fechaRevision: dto.fechaRevision,
      cantidadInicial: dto.cantidadInicial,
      cantidadRestante: dto.cantidadRestante,
      stockPorDelante: dto.stockPorDelante,
      consumo7d: dto.consumo7d,
      consumo28d: dto.consumo28d ?? null,
      origen,
    };

    const validos = EvaluacionLoteAggregate.validar(datos);
    if (DomainException.isDomainException(validos)) return validos;

    // The features look one week back and up to the expiry date. Outside the
    // loaded calendar, "is it a class day" has no answer.
    const semanaAnterior = textoDe(diaDe(dto.fechaRevision) - 7);
    if (!modelo.calendario.cubre(semanaAnterior) || !modelo.calendario.cubre(dto.fechaVencimiento)) {
      return DomainException.unprocessable(
        `El calendario de feriados cargado cubre de ${modelo.calendario.anioMinimo} a ${modelo.calendario.anioMaximo}; estas fechas quedan fuera.`,
      );
    }

    const prediccion = modelo.predecir({ ...datos, categoria: insumo.categoria });
    const evaluacion = await this.writeRepository.save(
      EvaluacionLoteAggregate.registrar(datos, validos, prediccion),
    );

    this.logger.logEvent('Evaluación registrada', {
      id: evaluacion.id,
      insumo: insumo.codigo,
      probabilidad: Number(prediccion.probabilidad.toFixed(4)),
      nivel: prediccion.nivel,
      origen,
    });

    return aRespuesta(evaluacion);
  }
}
