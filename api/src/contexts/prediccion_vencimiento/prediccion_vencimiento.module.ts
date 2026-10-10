import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreModule } from '@libs';
import { EliminarEvaluacionHandler } from './application/commands/handlers/eliminar.evaluacion.handler';
import { RegistrarEvaluacionHandler } from './application/commands/handlers/registrar.evaluacion.handler';
import { ListarEvaluacionesHandler } from './application/queries/handlers/listar.evaluaciones.handler';
import { ObtenerEvaluacionHandler } from './application/queries/handlers/obtener.evaluacion.handler';
import { ObtenerModeloHandler } from './application/queries/handlers/obtener.modelo.handler';
import { ModeloRiesgoArchivoRepository } from './infrastructure/modelo/modelo-riesgo.archivo.repository';
import { EvaluacionMemoriaRepository } from './infrastructure/persistence/repositories/evaluacion.memoria.repository';
import { SembrarInventario } from './infrastructure/semilla/sembrar-inventario';
import { EvaluacionLoteController } from './presentation/evaluacion-lote.controller';
import { ModeloRiesgoController } from './presentation/modelo-riesgo.controller';

const CommandHandlers = [RegistrarEvaluacionHandler, EliminarEvaluacionHandler];

const QueryHandlers = [ListarEvaluacionesHandler, ObtenerEvaluacionHandler, ObtenerModeloHandler];

/**
 * Bounded context: expiry-risk prediction for perishable lots.
 *
 * Same wiring as the SMC contexts: CQRS handlers, ports injected by string
 * token, one adapter class registered under the read and the write token.
 */
@Module({
  imports: [CqrsModule, CoreModule],
  controllers: [EvaluacionLoteController, ModeloRiesgoController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    EvaluacionMemoriaRepository,
    { provide: 'IEvaluacionReadRepository', useExisting: EvaluacionMemoriaRepository },
    { provide: 'IEvaluacionWriteRepository', useExisting: EvaluacionMemoriaRepository },
    { provide: 'IModeloRiesgoRepository', useClass: ModeloRiesgoArchivoRepository },
    SembrarInventario,
  ],
})
export class PrediccionVencimientoModule {}
