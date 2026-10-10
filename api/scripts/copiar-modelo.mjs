/**
 * Copies the artefacts produced by `ml/src/entrenar.py` into `modelo/`.
 *
 * The API never reads from `../ml` at runtime: it ships with the exact model
 * it was tested against. Retraining is an explicit step, followed by
 * `npm run check` (the parity test will fail if the export changed shape).
 */
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const origen = resolve(import.meta.dirname, '../../ml');
const destino = resolve(import.meta.dirname, '../modelo');

for (const [carpeta, archivo] of [
  ['artefactos', 'modelo_riesgo.json'],
  ['artefactos', 'calendario.json'],
  ['artefactos', 'paridad.json'],
  ['datos', 'lotes_vigentes.json'],
]) {
  copyFileSync(resolve(origen, carpeta, archivo), resolve(destino, archivo));
  console.log(`copiado ${archivo}`);
}
