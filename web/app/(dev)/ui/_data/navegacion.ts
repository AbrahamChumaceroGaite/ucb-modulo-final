/** Pasos de ejemplo del componente de etapas. */

import type { Paso } from '@/shared/ui/primitives';

export const PASOS: readonly Paso[] = [
  { clave: 'datos', titulo: 'Datos' },
  { clave: 'existencias', titulo: 'Existencias' },
  { clave: 'receta', titulo: 'Receta' },
  { clave: 'revision', titulo: 'Revisión' },
];
