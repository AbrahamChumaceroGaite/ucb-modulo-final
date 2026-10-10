/**
 * Qué color toma cada acción al atenderla.
 *
 * Vive fuera del componente porque es una tabla de decisión —qué significa
 * cada acción— y no la forma del botón. El `.tsx` de al lado solo la aplica.
 */

export const ACENTOS = {
  ver: 'hover:text-on-surface hover:bg-surface-container-highest [@media(hover:none)]:text-on-surface-variant',
  editar: 'hover:text-primary hover:bg-primary/12 [@media(hover:none)]:text-primary',
  eliminar: 'hover:text-error hover:bg-error/12 [@media(hover:none)]:text-error',
  restaurar: 'hover:text-success hover:bg-success/12 [@media(hover:none)]:text-success',
  destacar: 'hover:text-secondary hover:bg-secondary/12 [@media(hover:none)]:text-secondary',
} as const;

export type AccionIcono = keyof typeof ACENTOS;
