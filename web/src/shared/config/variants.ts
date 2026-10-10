/**
 * Vocabulario visual cerrado. Es la única lista de tonos y tamaños del proyecto.
 *
 * Auditamos una librería con 45 componentes donde el mismo estado se llamaba
 * `danger` en 11, `error` en 8 y `critical` en 2, y el mismo tamaño `default`,
 * `md` y `compact`. Tres vocabularios compitiendo dentro del mismo sistema.
 *
 * Si algo necesita un tono que no está aquí, la discusión es si el tono debe
 * existir — no se inventa en el componente.
 */

export type Tone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/*
  La unión se escribe a mano y no se deriva de un array `as const`, porque el
  array no lo importaba nadie y solo existía para producir este tipo. La lista
  sigue siendo cerrada: `TONO_CLASES` es un `Record<Tone, …>`, así que añadir
  un tono sin declarar sus clases no compila.

  Aquí hubo también `SIZE` y `RADIUS`. Se fueron por lo mismo:
  la escala de tamaños la declara cada componente en su prop `medida`
  (`'sm' | 'md'`) y la de radios la declara `globals.css`, que es donde el
  auditor de tokens la comprueba. Una tercera copia solo podía divergir.
*/

/**
 * Traducción de tono a clases, en un solo sitio.
 *
 * Cada tono se declara entero —texto, fondo tenue, borde y acento— para que un
 * componente no tenga que reconstruir la combinación y acabe inventando una
 * variante nueva a mitad de camino.
 */
export const TONO_CLASES: Record<Tone, { texto: string; fondo: string; borde: string; solido: string }> = {
  neutral: {
    texto: 'text-on-surface-variant',
    fondo: 'bg-surface-container-high',
    borde: 'border-outline-variant',
    solido: 'bg-surface-container-highest text-on-surface',
  },
  primary: {
    texto: 'text-primary',
    fondo: 'bg-primary-container',
    borde: 'border-primary',
    solido: 'bg-primary text-on-primary',
  },
  secondary: {
    texto: 'text-secondary',
    fondo: 'bg-secondary-container',
    borde: 'border-secondary',
    solido: 'bg-secondary text-on-secondary',
  },
  success: {
    texto: 'text-success',
    fondo: 'bg-success-container',
    borde: 'border-success',
    solido: 'bg-success text-on-success',
  },
  warning: {
    texto: 'text-warning',
    fondo: 'bg-warning-container',
    borde: 'border-warning',
    solido: 'bg-warning text-on-warning',
  },
  danger: {
    texto: 'text-error',
    fondo: 'bg-error-container',
    borde: 'border-error',
    solido: 'bg-error text-on-error',
  },
};
