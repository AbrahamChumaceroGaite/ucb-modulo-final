import type { Evaluacion, RegistrarEvaluacion } from './evaluacion.schema';

/**
 * Una evaluación → el formulario para **volver a revisar el mismo lote**.
 *
 * No hay edición: una evaluación es lo que el modelo dijo en una fecha, y
 * cambiarla después la convertiría en otra cosa. Lo que sí tiene sentido es
 * revisar el lote otra vez con los datos de hoy: el servicio la guarda como la
 * evaluación vigente de ese lote y retira la anterior.
 *
 * Por eso se copia el lote (insumo, fechas de ingreso y vencimiento, compra)
 * y se dejan para la persona los datos que cambian con los días: la revisión
 * pasa a `hoy`, y lo que queda y el consumo arrancan con lo último que se
 * sabía, para corregirlos con el kardex delante.
 */
export function aRevisionNueva(evaluacion: Evaluacion, hoy: string): RegistrarEvaluacion {
  return {
    codigoInsumo: evaluacion.codigoInsumo,
    fechaIngreso: evaluacion.fechaIngreso,
    fechaVencimiento: evaluacion.fechaVencimiento,
    fechaRevision: hoy,
    cantidadInicial: evaluacion.cantidadInicial,
    cantidadRestante: evaluacion.cantidadRestante,
    stockPorDelante: evaluacion.stockPorDelante,
    consumo7d: evaluacion.consumo7d,
    consumo28d: evaluacion.consumo28d,
  };
}
