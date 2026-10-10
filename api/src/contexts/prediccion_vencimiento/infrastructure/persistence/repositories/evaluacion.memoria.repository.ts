import { Injectable } from '@nestjs/common';
import { paginar, type Paginado } from '@libs';
import type { EvaluacionLoteAggregate } from '../../../domain/aggregates/evaluacion-lote.aggregate';
import type { IEvaluacionReadRepository } from '../../../domain/repositories/IEvaluacionRead.interface';
import type { IEvaluacionWriteRepository } from '../../../domain/repositories/IEvaluacionWrite.interface';
import { aRespuesta } from '../../../application/mappers/evaluacion.respuesta';
import type { EvaluacionListFilters, EvaluacionResponse } from '../../../application/types/evaluacion.types';

/**
 * In-memory adapter for both ports.
 *
 * Why not a database: the reviews are derived data (lot data from Spring plus
 * the model's answer) and this service has no table of its own yet. The ports
 * are the same ones a Prisma adapter would implement, as in the SMC, so moving
 * to a table is a new class here and nothing else. The limitation is stated
 * in the README: a restart forgets manual reviews and re-seeds the inventory
 * snapshot.
 *
 * Filtering and paging happen here, server-side, so the web never filters a
 * page it already loaded (RULES §16.11 of the web).
 */
@Injectable()
export class EvaluacionMemoriaRepository implements IEvaluacionReadRepository, IEvaluacionWriteRepository {
  private readonly evaluaciones = new Map<string, EvaluacionLoteAggregate>();

  async save(evaluacion: EvaluacionLoteAggregate): Promise<EvaluacionLoteAggregate> {
    for (const [id, existente] of this.evaluaciones) {
      if (existente.claveDelLote === evaluacion.claveDelLote) this.evaluaciones.delete(id);
    }
    this.evaluaciones.set(evaluacion.id, evaluacion);
    return evaluacion;
  }

  async delete(id: string): Promise<boolean> {
    return this.evaluaciones.delete(id);
  }

  async findById(id: string): Promise<EvaluacionResponse | null> {
    const evaluacion = this.evaluaciones.get(id);
    return evaluacion ? aRespuesta(evaluacion) : null;
  }

  async findAll(filtros: EvaluacionListFilters, skip: number, limit: number): Promise<Paginado<EvaluacionResponse>> {
    const busqueda = filtros.search ? normalizar(filtros.search) : null;

    const filas = [...this.evaluaciones.values()]
      .map(aRespuesta)
      .filter((e) => !busqueda || normalizar(e.insumo).includes(busqueda))
      .filter((e) => !filtros.riesgo?.length || filtros.riesgo.includes(e.nivel))
      .filter((e) => !filtros.categoria?.length || filtros.categoria.includes(e.categoria))
      .filter((e) => !filtros.venceDesde || e.fechaVencimiento >= filtros.venceDesde)
      .filter((e) => !filtros.venceHasta || e.fechaVencimiento <= filtros.venceHasta)
      // What needs attention first: highest risk, then what expires sooner.
      .sort(
        (a, b) =>
          b.probabilidad - a.probabilidad || a.fechaVencimiento.localeCompare(b.fechaVencimiento),
      );

    return paginar(filas, skip, limit);
  }
}

/** "Plátano" and "platano" are the same search. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
