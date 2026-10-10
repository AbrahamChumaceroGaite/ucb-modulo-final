import { join } from 'node:path';
import { DomainException, leerConfiguracion, type LoggerService } from '@libs';
import { ModeloRiesgoArchivoRepository } from '../../../infrastructure/modelo/modelo-riesgo.archivo.repository';
import { EvaluacionMemoriaRepository } from '../../../infrastructure/persistence/repositories/evaluacion.memoria.repository';
import type { RegistrarEvaluacionDto } from '../../dto/evaluacion.dto';
import { RegistrarEvaluacionCommand } from '../registrar.evaluacion.command';
import { RegistrarEvaluacionHandler } from './registrar.evaluacion.handler';

/**
 * The handler with the real model and the real in-memory adapter. Only the
 * logger is a stub: the point is to see the model's answer, not a mock's.
 */
const configuracion = leerConfiguracion({
  JWT_SECRET: 'x'.repeat(32),
  MODELO_DIR: join(__dirname, '../../../../../../modelo'),
});
const logger = { setContext: jest.fn(), logEvent: jest.fn() } as unknown as LoggerService;

const valido: RegistrarEvaluacionDto = {
  codigoInsumo: 'FRU-FRE',
  fechaIngreso: '2026-10-02',
  fechaVencimiento: '2026-10-05',
  fechaRevision: '2026-10-03',
  cantidadInicial: 1.5,
  cantidadRestante: 1.38,
  stockPorDelante: 0,
  consumo7d: 0.47,
  consumo28d: 0.52,
};

describe('RegistrarEvaluacionHandler', () => {
  let repositorio: EvaluacionMemoriaRepository;
  let handler: RegistrarEvaluacionHandler;

  beforeEach(() => {
    repositorio = new EvaluacionMemoriaRepository();
    handler = new RegistrarEvaluacionHandler(repositorio, new ModeloRiesgoArchivoRepository(configuracion), logger);
  });

  it('evalúa con el modelo, guarda y devuelve la respuesta', async () => {
    const resultado = await handler.execute(new RegistrarEvaluacionCommand(valido, 'manual'));
    if (DomainException.isDomainException(resultado)) throw resultado;

    expect(resultado.probabilidad).toBeGreaterThan(0);
    expect(resultado.probabilidad).toBeLessThan(1);
    expect(resultado.enRiesgo).toBe(resultado.probabilidad >= resultado.umbral);
    expect(resultado.diasParaVencer).toBe(2);
    expect(await repositorio.findById(resultado.id)).toEqual(resultado);
  });

  /**
   * The hard case the screen explains: at the recent pace the strawberries
   * last just under three days, so the coverage rule says "no risk". But the
   * review is on a Saturday and the next two days are a weekend: the model,
   * which learned the calendar, does flag it.
   */
  it('caso difícil: la regla no avisa y el modelo sí, por el fin de semana', async () => {
    const resultado = await handler.execute(new RegistrarEvaluacionCommand(valido, 'manual'));
    if (DomainException.isDomainException(resultado)) throw resultado;

    expect(resultado.reglaDeCobertura).toBe(false);
    expect(resultado.nivel).toBe('alto');
  });

  it('sin consumo de 28 días también responde, y sin consumo reciente la cobertura es máxima', async () => {
    const resultado = await handler.execute(
      new RegistrarEvaluacionCommand({ ...valido, consumo7d: 0, consumo28d: null }, 'manual'),
    );
    if (DomainException.isDomainException(resultado)) throw resultado;
    expect(resultado.diasCobertura).toBe(999);
    expect(resultado.reglaDeCobertura).toBe(true);
  });

  it('un insumo fuera del catálogo del modelo es 422 y no se guarda nada', async () => {
    const resultado = await handler.execute(new RegistrarEvaluacionCommand({ ...valido, codigoInsumo: 'CAF-GRA' }, 'manual'));
    expect(DomainException.isDomainException(resultado) && resultado.code).toBe(422);
    expect((await repositorio.findAll({}, 0, 10)).total).toBe(0);
  });

  it('fechas fuera del calendario cargado son 422', async () => {
    const resultado = await handler.execute(
      new RegistrarEvaluacionCommand(
        { ...valido, fechaIngreso: '2028-01-02', fechaVencimiento: '2028-01-06', fechaRevision: '2028-01-03' },
        'manual',
      ),
    );
    expect(DomainException.isDomainException(resultado) && resultado.message).toMatch(/2025 a 2027/);
  });
});
