import { DomainException } from '@libs';
import { CantidadesDelLote } from './cantidades-del-lote.vo';
import { ConsumoReciente } from './consumo-reciente.vo';
import { FechasDelLote } from './fechas-del-lote.vo';
import { nivelDeRiesgo } from './nivel-de-riesgo.vo';

const fechas = (ingreso: string, vencimiento: string, revision: string) =>
  FechasDelLote.create({ ingreso, vencimiento, revision });

const codigo = (resultado: unknown) => (DomainException.isDomainException(resultado) ? resultado.code : 'ok');

describe('FechasDelLote', () => {
  it('acepta un lote vigente y cuenta los días que le quedan', () => {
    const valido = fechas('2026-10-01', '2026-10-07', '2026-10-03');
    expect(valido).toBeInstanceOf(FechasDelLote);
    expect((valido as FechasDelLote).diasParaVencer).toBe(4);
  });

  it('el día del vencimiento todavía se evalúa', () => {
    expect((fechas('2026-10-01', '2026-10-03', '2026-10-03') as FechasDelLote).diasParaVencer).toBe(0);
  });

  it.each([
    ['fecha imposible', '2026-02-30', '2026-03-05', '2026-03-01', 400],
    ['vence antes de entrar', '2026-10-05', '2026-10-05', '2026-10-05', 422],
    ['revisión antes del ingreso', '2026-10-05', '2026-10-09', '2026-10-04', 422],
    ['ya venció', '2026-10-01', '2026-10-02', '2026-10-03', 422],
  ])('rechaza: %s', (_, ingreso, vence, revision, esperado) => {
    expect(codigo(fechas(ingreso, vence, revision))).toBe(esperado);
  });
});

describe('CantidadesDelLote', () => {
  it.each([
    [{ inicial: 0, restante: 0, porDelante: 0 }, 400],
    [{ inicial: 10, restante: 0, porDelante: 0 }, 422],
    [{ inicial: 10, restante: 11, porDelante: 0 }, 422],
    [{ inicial: 10, restante: 5, porDelante: -1 }, 400],
    [{ inicial: 10, restante: 10, porDelante: 0 }, 'ok'],
  ])('%o → %s', (cantidades, esperado) => {
    expect(codigo(CantidadesDelLote.create(cantidades))).toBe(esperado);
  });
});

describe('ConsumoReciente', () => {
  it('el consumo de 28 días puede faltar; el de 7 no puede ser negativo', () => {
    expect(codigo(ConsumoReciente.create({ promedio7d: 1, promedio28d: null }))).toBe('ok');
    expect(codigo(ConsumoReciente.create({ promedio7d: -1, promedio28d: null }))).toBe(400);
  });
});

describe('nivelDeRiesgo', () => {
  it('alto desde el umbral, vigilar desde la mitad', () => {
    expect(nivelDeRiesgo(0.3, 0.3)).toBe('alto');
    expect(nivelDeRiesgo(0.15, 0.3)).toBe('vigilar');
    expect(nivelDeRiesgo(0.149, 0.3)).toBe('bajo');
  });
});
