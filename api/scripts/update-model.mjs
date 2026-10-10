/**
 * Copies the artifacts produced by `training/src/train.py` into `model/`.
 *
 * The API never reads `training/` at runtime: it ships with the exact model it
 * was tested against. Retraining is an explicit step followed by
 * `npm run check`, whose parity test fails if the export changed shape.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '../training/artifacts');
const target = resolve(import.meta.dirname, '../model');
mkdirSync(target, { recursive: true });

for (const file of ['risk_model.json', 'calendar.json', 'parity.json']) {
  copyFileSync(resolve(source, file), resolve(target, file));
  console.log(`copied ${file}`);
}
