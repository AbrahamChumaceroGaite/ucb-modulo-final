import { describe, expect, it } from 'vitest';
import {
  coincidenModeloYRegla,
  falsasAlarmasPorCien,
  notaDeLaTarjeta,
  porcentajeDeRiesgo,
  textoDeRiesgo,
  nombreDeCategoria,
  textoDeCobertura,
  textoDeLoQueQueda,
  textoDeVencimiento,
  textoDelSobrante,
  veredictoDeLaRegla,
} from './evaluacion.lectura';
import type { Evaluacion } from './evaluacion.schema';

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

describe('lectura de una evaluación', () => {
  it('dice cuándo vence en palabras', () => {
    expect([0, 1, 4].map(textoDeVencimiento)).toEqual(['Vence hoy', 'Vence mañana', 'Vence en 4 días']);
  });

  it('dice lo que queda como cantidad, no como porcentaje', () => {
    expect(textoDeLoQueQueda(FRUTILLA)).toBe('Quedan 1,38 de 1,5 kg');
  });

  it('cuando la regla y el modelo discrepan, lo dice', () => {
    expect(coincidenModeloYRegla(FRUTILLA)).toBe(false);
    expect(veredictoDeLaRegla(FRUTILLA)).toMatch(/no avisa/);
  });

  it('sin consumo registrado la regla no opina: ni coincide ni discrepa', () => {
    const sinConsumo = { ...FRUTILLA, reglaDeCobertura: null };
    expect(coincidenModeloYRegla(sinConsumo)).toBeNull();
    expect(veredictoDeLaRegla(sinConsumo)).toMatch(/no puede juzgar/);
  });

  it('el sobrante: «se termina» si es cero, la cantidad si sobra, nada si no se sabe', () => {
    expect(textoDelSobrante(FRUTILLA)).toMatch(/se termina antes de vencer/);
    expect(textoDelSobrante({ ...FRUTILLA, sobranteEstimado: 0.4 })).toBe(
      'Al ritmo de la semana quedarían unos 0,4 kg al vencer',
    );
    expect(textoDelSobrante({ ...FRUTILLA, sobranteEstimado: null })).toBeNull();
  });

  it('la cobertura topada no es un plazo: es que no se está usando', () => {
    expect(textoDeCobertura(FRUTILLA)).toBe('2,95 días');
    expect(textoDeCobertura({ ...FRUTILLA, diasCobertura: 999 })).toBe('No se está usando');
    expect(textoDeCobertura({ ...FRUTILLA, diasCobertura: null })).toBeNull();
  });

  it('una categoría que la pantalla no conoce se enseña tal cual, no se esconde', () => {
    expect(nombreDeCategoria('panaderia')).toBe('Panadería');
    expect(nombreDeCategoria('bebidas')).toBe('bebidas');
  });

  it('las falsas alarmas salen de la precisión de prueba, redondeadas', () => {
    const metricas = { recall: 0.92, precision: 0.7706, accuracy: 0.95, f1: 0.84, avisoAnticipado2Dias: 0.91 };
    const modelo = {
      version: '1.0.0',
      entrenadoEl: '2026-10-03T00:00:00+00:00',
      umbral: 0.286,
      recallObjetivo: 0.85,
      calendario: { anioMinimo: 2025, anioMaximo: 2027 },
      insumos: [],
      metricas: { modelo: metricas, regla: metricas },
    };
    expect(falsasAlarmasPorCien(modelo)).toBe(23);
  });

  it('por debajo del 1 % no dice «0%»: un modelo no da certezas', () => {
    expect(porcentajeDeRiesgo(0.0029)).toBe('menos de 1%');
    expect(porcentajeDeRiesgo(0.743)).toBe('74%');
    expect(textoDeRiesgo(FRUTILLA)).toBe('Usar primero · 74%');
  });

  it('el pie de la tarjeta: primero la discrepancia, luego el sobrante, si no nada', () => {
    expect(notaDeLaTarjeta(FRUTILLA)).toBe('La regla simple no avisa y el modelo sí: conviene mirarlo');
    const coinciden = { ...FRUTILLA, reglaDeCobertura: true };
    expect(notaDeLaTarjeta(coinciden)).toBeNull();
    expect(notaDeLaTarjeta({ ...coinciden, sobranteEstimado: 0.4 })).toMatch(/quedarían unos 0,4 kg/);
  });
});
