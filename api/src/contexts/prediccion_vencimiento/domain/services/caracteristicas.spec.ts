import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BosqueLightGbm, type NodoLightGbm } from './bosque-lightgbm';
import { CalendarioOperativo } from './calendario-operativo';
import { construirCaracteristicas, reglaDeCobertura, VARIABLES } from './caracteristicas';

/**
 * Parity with Python.
 *
 * `ml/src/entrenar.py` exports 400+ test rows with their raw inputs, the
 * features Python computed and the probability LightGBM gave. If any feature
 * or any tree split were ported differently, some row here would disagree.
 * This is the test that allows saying "the API runs the trained model", and
 * not a reimplementation that looks like it.
 */
const MODELO_DIR = join(__dirname, '../../../../../modelo');
const leer = <T>(archivo: string): T => JSON.parse(readFileSync(join(MODELO_DIR, archivo), 'utf8')) as T;

interface Caso {
  entrada: {
    categoria: string;
    fecha_ingreso: string;
    fecha_vencimiento: string;
    fecha_revision: string;
    cantidad_inicial: number;
    cantidad_restante: number;
    stock_por_delante: number;
    consumo_7d: number | null;
    consumo_28d: number | null;
  };
  caracteristicas: (number | null)[];
  probabilidad: number;
  regla: number;
}

const casos = leer<Caso[]>('paridad.json');
const calendario = new CalendarioOperativo(leer('calendario.json'));
const artefacto = leer<{ lightgbm: { objetivo: string; arboles: NodoLightGbm[] } }>('modelo_riesgo.json');
const bosque = new BosqueLightGbm(artefacto.lightgbm.arboles, artefacto.lightgbm.objetivo);

const calcular = (caso: Caso) =>
  construirCaracteristicas(
    {
      categoria: caso.entrada.categoria,
      fechaIngreso: caso.entrada.fecha_ingreso,
      fechaVencimiento: caso.entrada.fecha_vencimiento,
      fechaRevision: caso.entrada.fecha_revision,
      cantidadInicial: caso.entrada.cantidad_inicial,
      cantidadRestante: caso.entrada.cantidad_restante,
      stockPorDelante: caso.entrada.stock_por_delante,
      consumo7d: caso.entrada.consumo_7d,
      consumo28d: caso.entrada.consumo_28d,
    },
    calendario,
  );

describe('paridad con el entrenamiento en Python', () => {
  it('hay casos suficientes, incluidos algunos con consumo faltante', () => {
    expect(casos.length).toBeGreaterThan(400);
    expect(casos.some((c) => c.entrada.consumo_28d === null)).toBe(true);
  });

  it('cada característica es idéntica a la de Python, bit a bit', () => {
    for (const caso of casos) {
      const x = calcular(caso);
      x.forEach((valor, i) => {
        const esperado = caso.caracteristicas[i];
        if (esperado === null) {
          expect({ variable: VARIABLES[i], valor }).toEqual({ variable: VARIABLES[i], valor: Number.NaN });
        } else {
          expect({ variable: VARIABLES[i], valor }).toEqual({ variable: VARIABLES[i], valor: esperado });
        }
      });
    }
  });

  it('la probabilidad coincide con la de LightGBM a 1e-12', () => {
    const diferencias = casos.map((caso) => Math.abs(bosque.probabilidad(calcular(caso)) - caso.probabilidad));
    expect(Math.max(...diferencias)).toBeLessThan(1e-12);
  });

  it('la regla de cobertura decide lo mismo (sin datos = no marca, como en Python)', () => {
    for (const caso of casos) {
      expect(Number(reglaDeCobertura(calcular(caso)) === true)).toBe(caso.regla);
    }
  });
});
