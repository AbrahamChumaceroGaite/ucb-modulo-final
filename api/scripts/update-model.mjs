/** Copies the artifacts of `training/src/train.py` into `model/`. Run `npm run check` afterwards. */
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '../training/artifacts');
const target = resolve(import.meta.dirname, '../model');
mkdirSync(target, { recursive: true });

for (const file of ['risk_model.json', 'calendar.json', 'parity.json']) {
  copyFileSync(resolve(source, file), resolve(target, file));
  console.log(`copied ${file}`);
}
