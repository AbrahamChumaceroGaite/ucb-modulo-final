import { randomUUID } from 'node:crypto';
import { DomainException, EntityBase } from '@libs';
import type { InsumoDelCatalogo, Prediccion } from '../entities/modelo-riesgo.entity';
import { CantidadesDelLote } from '../value_objects/cantidades-del-lote.vo';
import { ConsumoReciente } from '../value_objects/consumo-reciente.vo';
import { FechasDelLote } from '../value_objects/fechas-del-lote.vo';

/** Where the review came from: the inventory snapshot or a person's form. */
export type OrigenEvaluacion = 'inventario' | 'manual';

export interface DatosDeEvaluacion {
  insumo: InsumoDelCatalogo;
  fechaIngreso: string;
  fechaVencimiento: string;
  fechaRevision: string;
  cantidadInicial: number;
  cantidadRestante: number;
  stockPorDelante: number;
  consumo7d: number;
  consumo28d: number | null;
  origen: OrigenEvaluacion;
}

/**
 * One review of one lot, with the model's answer frozen at that moment.
 *
 * The prediction is stored, not recomputed on read: if the model is
 * retrained, an old review keeps saying what the model said back then, and
 * `versionModelo` says which model it was.
 *
 * A lot has at most one review in the list: the latest one. Reviewing the
 * same lot again replaces the previous review instead of adding a twin card
 * that says something older (seen in the browser: two "Frutilla" cards with
 * the same buttons, indistinguishable for a screen reader too).
 */
export class EvaluacionLoteAggregate extends EntityBase {
  private constructor(
    id: string,
    public readonly insumo: InsumoDelCatalogo,
    public readonly fechas: FechasDelLote,
    public readonly cantidades: CantidadesDelLote,
    public readonly consumo: ConsumoReciente,
    public readonly prediccion: Prediccion,
    public readonly origen: OrigenEvaluacion,
    public readonly registradaEl: Date,
  ) {
    super(id);
  }

  /**
   * What identifies the physical lot: item, entry and expiry dates and the
   * quantity bought. Spring's lot id is not available here (the review is
   * typed in or seeded), so this is the closest stable identity.
   */
  get claveDelLote(): string {
    const { ingreso, vencimiento } = this.fechas.value;
    return [this.insumo.codigo, ingreso, vencimiento, this.cantidades.value.inicial].join('|');
  }

  /** Validates the inputs. The prediction comes from `ModeloRiesgo` once they are valid. */
  static validar(
    datos: DatosDeEvaluacion,
  ): { fechas: FechasDelLote; cantidades: CantidadesDelLote; consumo: ConsumoReciente } | DomainException {
    const fechas = FechasDelLote.create({
      ingreso: datos.fechaIngreso,
      vencimiento: datos.fechaVencimiento,
      revision: datos.fechaRevision,
    });
    if (DomainException.isDomainException(fechas)) return fechas;

    const cantidades = CantidadesDelLote.create({
      inicial: datos.cantidadInicial,
      restante: datos.cantidadRestante,
      porDelante: datos.stockPorDelante,
    });
    if (DomainException.isDomainException(cantidades)) return cantidades;

    const consumo = ConsumoReciente.create({ promedio7d: datos.consumo7d, promedio28d: datos.consumo28d });
    if (DomainException.isDomainException(consumo)) return consumo;

    return { fechas, cantidades, consumo };
  }

  static registrar(
    datos: DatosDeEvaluacion,
    validos: { fechas: FechasDelLote; cantidades: CantidadesDelLote; consumo: ConsumoReciente },
    prediccion: Prediccion,
  ): EvaluacionLoteAggregate {
    return new EvaluacionLoteAggregate(
      randomUUID(),
      datos.insumo,
      validos.fechas,
      validos.cantidades,
      validos.consumo,
      prediccion,
      datos.origen,
      new Date(),
    );
  }
}
