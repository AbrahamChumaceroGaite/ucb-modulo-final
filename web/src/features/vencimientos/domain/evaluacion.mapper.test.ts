import { describe, expect, it } from 'vitest';
import { aRevisionNueva } from './evaluacion.mapper';
import { registrarEvaluacionSchema, type Evaluacion } from './evaluacion.schema';

/**
 * El lote de frutilla del inventario sembrado (sábado 3 de octubre de 2026),
 * tal como lo devuelve el servicio: la regla no avisa y el modelo sí, que es
 * el caso que más hay que saber leer.
 *
 * Está escrito en cada prueba que lo usa y no en un archivo común: un dato que
 * solo usan las pruebas es un resto para `audit-muertos`, y `shared/testing`
 * no puede saber qué es una frutilla.
 */
const FRUTILLA: Evaluacion = {
  id: '814cf54d-f295-4522-a97b-ef22f9707c0d',
  codigoInsumo: 'FRU-FRE',
  insumo: 'Frutilla',
  categoria: 'frutas',
  unidad: 'kg',
  fechaIngreso: '2026-10-02',
  fechaVencimiento: '2026-10-05',
  fechaRevision: '2026-10-03',
  cantidadInicial: 1.5,
  cantidadRestante: 1.379,
  stockPorDelante: 0,
  consumo7d: 0.4681,
  consumo28d: 0.5158,
  diasParaVencer: 2,
  probabilidad: 0.7435742443865775,
  umbral: 0.286006996275895,
  nivel: 'alto',
  enRiesgo: true,
  reglaDeCobertura: false,
  diasCobertura: 2.9459517197180087,
  sobranteEstimado: 0,
  versionModelo: '1.0.0',
  origen: 'inventario',
  registradaEl: '2026-10-03T04:18:43.918Z',
};

describe('aRevisionNueva', () => {
  it('copia el lote y mueve la revisión a hoy', () => {
    const valores = aRevisionNueva(FRUTILLA, '2026-10-04');
    expect(valores).toMatchObject({
      codigoInsumo: 'FRU-FRE',
      fechaIngreso: '2026-10-02',
      fechaVencimiento: '2026-10-05',
      fechaRevision: '2026-10-04',
    });
  });

  it('lo que arma es un formulario válido mientras el lote no haya vencido', () => {
    expect(registrarEvaluacionSchema.safeParse(aRevisionNueva(FRUTILLA, '2026-10-05')).success).toBe(true);
  });

  it('si ya venció, el formulario lo dice en vez de evaluar a ciegas', () => {
    expect(registrarEvaluacionSchema.safeParse(aRevisionNueva(FRUTILLA, '2026-10-06')).success).toBe(false);
  });
});
