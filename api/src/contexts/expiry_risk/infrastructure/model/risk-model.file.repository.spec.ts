import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MODEL_DIR, testConfig } from '@libs/testing/test-config';
import { RiskModelFileRepository } from './risk-model.file.repository';

/** A copy of the shipped model with `risk_model.json` edited, in a temporary folder. */
function tamperedModel(edit: (artifact: Record<string, unknown> & { lightgbm: { trees: unknown[] } }) => void): string {
  const folder = mkdtempSync(join(tmpdir(), 'risk-model-'));
  copyFileSync(join(MODEL_DIR, 'calendar.json'), join(folder, 'calendar.json'));
  const artifact = JSON.parse(readFileSync(join(MODEL_DIR, 'risk_model.json'), 'utf8'));
  edit(artifact);
  writeFileSync(join(folder, 'risk_model.json'), JSON.stringify(artifact));
  return folder;
}

const load = (modelDir: string) => new RiskModelFileRepository(testConfig({ modelDir }));

describe('RiskModelFileRepository', () => {
  it('loads the shipped model with its card', () => {
    const { card } = load(MODEL_DIR).get();
    expect(card.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(card.threshold).toBeGreaterThan(0);
    expect(card.products).toHaveLength(12);
  });

  it('stops the API when the model folder is empty, and says how to fix it', () => {
    expect(() => load(mkdtempSync(join(tmpdir(), 'empty-')))).toThrow('npm run model:update');
  });

  it('stops the API when training changed the feature order', () => {
    const folder = tamperedModel((artifact) => {
      const features = artifact.features as string[];
      [features[0], features[1]] = [features[1], features[0]];
    });
    expect(() => load(folder)).toThrow('no coinciden');
  });

  it('stops the API when trees are missing', () => {
    const folder = tamperedModel((artifact) => artifact.lightgbm.trees.pop());
    expect(() => load(folder)).toThrow('faltan árboles');
  });
});
