import { describe, expect, it } from 'vitest';
import { evaluacionSchema, registrarEvaluacionSchema, type Evaluacion } from './evaluacion.schema';

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

const valido = {
  codigoInsumo: 'FRU-FRE',
  fechaIngreso: '2026-10-02',
  fechaVencimiento: '2026-10-05',
  fechaRevision: '2026-10-03',
  cantidadInicial: 1.5,
  cantidadRestante: 1.38,
  stockPorDelante: 0,
  consumo7d: 0.47,
  consumo28d: null,
};

const errores = (valores: object) => {
  const resultado = registrarEvaluacionSchema.safeParse(valores);
  return resultado.success ? {} : Object.fromEntries(resultado.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('evaluacionSchema', () => {
  it('acepta la respuesta del servicio tal cual llega', () => {
    expect(evaluacionSchema.parse(FRUTILLA)).toEqual(FRUTILLA);
  });

  it('un nivel que el servicio no conoce revienta en el borde, con su nombre', () => {
    const resultado = evaluacionSchema.safeParse({ ...FRUTILLA, nivel: 'critico' });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.path).toEqual(['nivel']);
  });
});

describe('registrarEvaluacionSchema', () => {
  it('el consumo de 28 días puede faltar', () => {
    expect(errores(valido)).toEqual({});
  });

  it('las reglas que cruzan campos señalan el campo que hay que corregir', () => {
    expect(errores({ ...valido, cantidadRestante: 2 })).toEqual({
      cantidadRestante: 'No puede quedar más de lo que se compró',
    });
    expect(errores({ ...valido, fechaVencimiento: '2026-10-02' })).toMatchObject({
      fechaVencimiento: 'Tiene que ser posterior al ingreso',
    });
    expect(errores({ ...valido, fechaRevision: '2026-10-06' })).toEqual({
      fechaRevision: 'El lote ya venció en esta fecha: eso es merma, no riesgo',
    });
  });

  it('un lote vacío no se evalúa', () => {
    expect(errores({ ...valido, cantidadRestante: 0 })).toEqual({
      cantidadRestante: 'Si no queda nada, no hay riesgo que evaluar',
    });
  });
});
