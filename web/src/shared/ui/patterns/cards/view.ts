/**
 * Las formas en que una colección se puede mirar.
 *
 * Es una lista cerrada y vive aparte de los componentes porque la comparten
 * tres: el alternador que la cambia, la rejilla que la aplica y la tarjeta que
 * se adapta. Si cada uno trajera la suya, añadir una vista sería tocar tres
 * uniones y descubrir la cuarta en producción.
 */
export const VISTAS = ['rejilla', 'lista', 'compacta', 'tabla'] as const;
export type Vista = (typeof VISTAS)[number];

/**
 * Cuánto mide lo más estrecho que puede llegar a ser una tarjeta en cada vista.
 *
 * Es lo único que la rejilla necesita saber: con `auto-fill` y `minmax`, el
 * número de columnas lo decide el ancho disponible. **No hay breakpoints.**
 * Una rejilla con puntos de corte fijos siempre se rompe en la medida que
 * nadie probó — y además no sabe nada del panel lateral que la estrecha.
 */
export const ANCHO_MINIMO: Record<Exclude<Vista, 'tabla' | 'lista'>, string> = {
  rejilla: '17rem',
  compacta: '12rem',
};
