import { parityRows, pythonFeatures, readModelFile } from '../../testing/model-files';
import { LightGbmForest, type TreeNode } from './lightgbm-forest';

interface ModelFile {
  lightgbm: { objective: string; trees: TreeNode[] };
}

const leaf = (leaf_value: number): TreeNode => ({ leaf_value });

/** One split on feature 0 at 0.5: left leaf −1, right leaf +1. */
function stump(missing_type: 'None' | 'NaN' | 'Zero', default_left: boolean): LightGbmForest {
  return new LightGbmForest(
    [{ split_feature: 0, threshold: 0.5, decision_type: '<=', default_left, missing_type, left_child: leaf(-1), right_child: leaf(1) }],
    'binary sigmoid:1',
  );
}

const LEFT = 1 / (1 + Math.exp(1));
const RIGHT = 1 / (1 + Math.exp(-1));

describe('LightGbmForest', () => {
  it('gives the probability Python gave, to 1e-12, on every exported row', () => {
    const { lightgbm } = readModelFile<ModelFile>('risk_model.json');
    const forest = new LightGbmForest(lightgbm.trees, lightgbm.objective);

    const worst = Math.max(...parityRows.map((row) => Math.abs(forest.probability(pythonFeatures(row)) - row.probability)));
    expect(worst).toBeLessThan(1e-12);
  });

  it('sends NaN to the default side when the split learnt a missing branch', () => {
    expect(stump('NaN', false).probability([Number.NaN])).toBe(RIGHT);
    expect(stump('NaN', true).probability([Number.NaN])).toBe(LEFT);
  });

  it('reads NaN as zero when the split has no missing branch', () => {
    expect(stump('None', false).probability([Number.NaN])).toBe(LEFT);
  });

  it('treats zero as missing in a "Zero" split', () => {
    expect(stump('Zero', false).probability([0])).toBe(RIGHT);
    expect(stump('Zero', false).probability([0.2])).toBe(LEFT);
  });

  it('refuses at load time what it cannot evaluate', () => {
    expect(() => new LightGbmForest([], 'multiclass num_class:3')).toThrow('no soportado');
    const categorical: TreeNode = {
      split_feature: 0, threshold: 1, decision_type: '==', default_left: true, missing_type: 'None', left_child: leaf(0), right_child: leaf(0),
    };
    expect(() => new LightGbmForest([categorical], 'binary sigmoid:1')).toThrow('categórica');
  });
});
