import { join } from 'node:path';
import { DomainException, leerConfiguracion, type LoggerService } from '@libs';
import { RegistrarEvaluacionHandler } from '../../../application/commands/handlers/registrar.evaluacion.handler';
import { RegistrarEvaluacionCommand } from '../../../application/commands/registrar.evaluacion.command';
import { ModeloRiesgoArchivoRepository } from '../../modelo/modelo-riesgo.archivo.repository';
import { EvaluacionMemoriaRepository } from './evaluacion.memoria.repository';

const configuracion = leerConfiguracion({ JWT_SECRET: 'x'.repeat(32), MODELO_DIR: join(__dirname, '../../../../../../modelo') });
const logger = { setContext: jest.fn(), logEvent: jest.fn() } as unknown as LoggerService;

const base = {
  fechaIngreso: '2026-10-01',
  fechaRevision: '2026-10-03',
  cantidadInicial: 10,
  stockPorDelante: 0,
  consumo28d: null,
};

describe('EvaluacionMemoriaRepository: filtros y orden en el servidor', () => {
  const repositorio = new EvaluacionMemoriaRepository();

  beforeAll(async () => {
    const handler = new RegistrarEvaluacionHandler(repositorio, new ModeloRiesgoArchivoRepository(configuracion), logger);
    for (const dto of [
      { ...base, codigoInsumo: 'FRU-PLA', fechaVencimiento: '2026-10-05', cantidadRestante: 9, consumo7d: 0.2 },
      { ...base, codigoInsumo: 'LEC-ENT', fechaVencimiento: '2026-10-08', cantidadRestante: 4, consumo7d: 6 },
      { ...base, codigoInsumo: 'PAN-MOL', fechaVencimiento: '2026-10-06', cantidadRestante: 5, consumo7d: 1 },
    ]) {
      const r = await handler.execute(new RegistrarEvaluacionCommand(dto, 'manual'));
      if (DomainException.isDomainException(r)) throw r;
    }
  });

  it('ordena por riesgo, de mayor a menor', async () => {
    const { data } = await repositorio.findAll({}, 0, 10);
    const probabilidades = data.map((e) => e.probabilidad);
    expect(probabilidades).toEqual([...probabilidades].sort((a, b) => b - a));
  });

  it('busca sin importar tildes ni mayúsculas', async () => {
    expect((await repositorio.findAll({ search: 'PLATANO' }, 0, 10)).data.map((e) => e.codigoInsumo)).toEqual(['FRU-PLA']);
  });

  it('cruza grupos y suma valores dentro de un grupo', async () => {
    const { data } = await repositorio.findAll({ categoria: ['frutas', 'lacteos'], venceHasta: '2026-10-06' }, 0, 10);
    expect(data.map((e) => e.codigoInsumo)).toEqual(['FRU-PLA']);
  });

  it('pagina con skip y limit y dice si hay más', async () => {
    const pagina = await repositorio.findAll({}, 1, 1);
    expect(pagina).toMatchObject({ skip: 1, limit: 1, total: 3, hasMore: true });
    expect(pagina.data).toHaveLength(1);
  });
});
