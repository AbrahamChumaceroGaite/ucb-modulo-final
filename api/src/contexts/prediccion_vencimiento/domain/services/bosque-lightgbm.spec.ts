import { BosqueLightGbm, type NodoLightGbm } from './bosque-lightgbm';

/**
 * The three missing-value rules of LightGBM, on a one-split tree where the
 * answer is visible: left leaf = -1, right leaf = +1, threshold 0.5.
 */
const arbol = (missing_type: 'None' | 'NaN' | 'Zero', default_left: boolean): NodoLightGbm => ({
  split_feature: 0,
  threshold: 0.5,
  decision_type: '<=',
  default_left,
  missing_type,
  left_child: { leaf_value: -1 },
  right_child: { leaf_value: 1 },
});

const lado = (bosque: BosqueLightGbm, x: number) => (bosque.probabilidad([x]) < 0.5 ? 'izquierda' : 'derecha');

describe('BosqueLightGbm', () => {
  it('compara con <= el umbral', () => {
    const bosque = new BosqueLightGbm([arbol('NaN', false)], 'binary sigmoid:1');
    expect(lado(bosque, 0.5)).toBe('izquierda');
    expect(lado(bosque, 0.50001)).toBe('derecha');
  });

  it('missing_type NaN: el faltante va al lado por defecto', () => {
    expect(lado(new BosqueLightGbm([arbol('NaN', false)], 'binary sigmoid:1'), Number.NaN)).toBe('derecha');
    expect(lado(new BosqueLightGbm([arbol('NaN', true)], 'binary sigmoid:1'), Number.NaN)).toBe('izquierda');
  });

  it('missing_type None: el faltante cuenta como cero', () => {
    // default_left=false would send it right; as 0 <= 0.5 it goes left.
    expect(lado(new BosqueLightGbm([arbol('None', false)], 'binary sigmoid:1'), Number.NaN)).toBe('izquierda');
  });

  it('missing_type Zero: el cero también es faltante', () => {
    expect(lado(new BosqueLightGbm([arbol('Zero', false)], 'binary sigmoid:1'), 0)).toBe('derecha');
  });

  it('suma los árboles y aplica la sigmoide', () => {
    const bosque = new BosqueLightGbm([arbol('NaN', false), arbol('NaN', false)], 'binary sigmoid:1');
    expect(bosque.probabilidad([1])).toBeCloseTo(1 / (1 + Math.exp(-2)), 12);
  });

  it('se niega a cargar algo que no sabe evaluar', () => {
    expect(() => new BosqueLightGbm([], 'multiclass num_class:3')).toThrow(/no soportado/);
    expect(() => new BosqueLightGbm([{ ...arbol('NaN', false), decision_type: '==' } as NodoLightGbm], 'binary sigmoid:1')).toThrow(
      /categórica/,
    );
  });
});
