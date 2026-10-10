import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CONFIGURACION, DomainException, LoggerService, type Configuracion } from '@libs';
import { RegistrarEvaluacionCommand } from '../../application/commands/registrar.evaluacion.command';
import type { RegistrarEvaluacionDto } from '../../application/dto/evaluacion.dto';

/** One row of `lotes_vigentes.json`, written by `ml/src/generar_datos.py`. */
interface LoteVigente {
  codigo_insumo: string;
  fecha_ingreso: string;
  fecha_vencimiento: string;
  fecha_revision: string;
  cantidad_inicial: number;
  cantidad_restante: number;
  stock_por_delante: number;
  consumo_7d: number | null;
  consumo_28d: number | null;
}

/**
 * Fills the list with the lots open at the dataset's cut date.
 *
 * They go through the same command as a manual review: same validation, same
 * model, computed now. Nothing is precomputed or written by hand; the file
 * holds only the raw lot data, never a probability.
 */
@Injectable()
export class SembrarInventario implements OnApplicationBootstrap {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('SembrarInventario');
  }

  async onApplicationBootstrap(): Promise<void> {
    const ruta = join(this.configuracion.modeloDir, 'lotes_vigentes.json');
    const lotes = JSON.parse(readFileSync(ruta, 'utf8')) as LoteVigente[];

    let registradas = 0;
    for (const lote of lotes) {
      // The form requires the 7-day average; so does the seed.
      if (lote.consumo_7d === null) continue;
      const resultado: unknown = await this.commandBus.execute(
        new RegistrarEvaluacionCommand(aDto(lote, lote.consumo_7d), 'inventario'),
      );
      if (DomainException.isDomainException(resultado)) {
        this.logger.warn(`Lote del inventario omitido: ${resultado.message}`);
      } else {
        registradas += 1;
      }
    }
    this.logger.logEvent('Inventario sembrado', { lotes: lotes.length, registradas });
  }
}

function aDto(lote: LoteVigente, consumo7d: number): RegistrarEvaluacionDto {
  return {
    codigoInsumo: lote.codigo_insumo,
    fechaIngreso: lote.fecha_ingreso,
    fechaVencimiento: lote.fecha_vencimiento,
    fechaRevision: lote.fecha_revision,
    cantidadInicial: lote.cantidad_inicial,
    cantidadRestante: lote.cantidad_restante,
    stockPorDelante: lote.stock_por_delante,
    consumo7d,
    consumo28d: lote.consumo_28d,
  };
}
