/**
 * Estilos del calendario, con los tokens del sistema.
 *
 * Se declaran una vez y los comparten el selector de fecha y el de intervalo:
 * dos calendarios con estilos distintos en la misma aplicación es el tipo de
 * incoherencia que un sistema de diseño existe para evitar.
 *
 * Vive en su propio archivo porque son cuarenta líneas de tabla que no cambian
 * con la lógica del componente: mezcladas con él, había que bajarlas enteras
 * para llegar al primer `return`.
 */
export const CLASES_CALENDARIO = {
  months: 'flex flex-col gap-3',
  month_caption: 'flex items-center justify-center h-8 text-sm font-medium text-on-surface',
  nav: 'absolute right-1 top-1 flex gap-1',
  button_previous:
    'inline-flex size-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors',
  button_next:
    'inline-flex size-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-9 text-[0.625rem] font-semibold uppercase tracking-wide text-on-surface-variant',
  week: 'flex w-full',
  day: 'p-0',
  day_button:
    'inline-flex size-9 items-center justify-center rounded-full text-xs text-on-surface transition-colors hover:bg-surface-container-highest',
  selected: '[&>button]:bg-primary [&>button]:text-on-primary [&>button]:hover:bg-primary',
  today: '[&>button]:font-bold [&>button]:text-secondary',
  outside: 'opacity-35',
  disabled: 'opacity-25 pointer-events-none',
  // Los días de en medio van con `rounded-sm` y no cuadrados: la regla de
  // diseño no admite esquinas rectas ni siquiera dentro de un rango.
  range_middle: '[&>button]:rounded-sm [&>button]:bg-primary-container [&>button]:text-on-primary-container',
  range_start: '[&>button]:rounded-l-full',
  range_end: '[&>button]:rounded-r-full',
} as const;
