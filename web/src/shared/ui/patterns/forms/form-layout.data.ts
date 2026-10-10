/**
 * Cuánto ocupa un campo dentro de su fila.
 *
 * Es la única escala de anchos del proyecto: no hay `grid-cols-*` sueltos en
 * las pantallas.
 */

export const TRAMOS = {
  completo: '100%',
  mitad: '50%',
  tercio: '33.333%',
  dosTercios: '66.666%',
  cuarto: '25%',
} as const;

export type Tramo = keyof typeof TRAMOS;
