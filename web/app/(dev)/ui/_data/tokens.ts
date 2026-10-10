/** Lo que el escaparate enseña de la paleta y de la escala de radios. */

export const SUPERFICIES = [
  { clase: 'bg-surface', nombre: 'surface', uso: 'El lienzo' },
  { clase: 'bg-surface-container-low', nombre: 'container-low', uso: 'Apenas elevado' },
  { clase: 'bg-surface-container', nombre: 'container', uso: 'Tarjetas y paneles' },
  { clase: 'bg-surface-container-high', nombre: 'container-high', uso: 'Cabecera, menús' },
  { clase: 'bg-surface-container-highest', nombre: 'container-highest', uso: 'Lo que flota' },
];

export const ACENTOS = [
  { clase: 'bg-primary text-on-primary', nombre: 'primary', uso: 'Acción principal' },
  { clase: 'bg-secondary text-on-secondary', nombre: 'secondary', uso: 'Acento cálido' },
  { clase: 'bg-success text-on-success', nombre: 'success', uso: 'Todo en orden' },
  { clase: 'bg-warning text-on-warning', nombre: 'warning', uso: 'Conviene mirar' },
  { clase: 'bg-error text-on-error', nombre: 'error', uso: 'Algo falló' },
];

export const RADIOS = [
  { clase: 'rounded-sm', nombre: 'sm · 0.5rem', uso: 'Celdas densas' },
  { clase: 'rounded-md', nombre: 'md · 0.75rem', uso: 'Por defecto' },
  { clase: 'rounded-xl', nombre: 'xl · 1.5rem', uso: 'Contenedores' },
  { clase: 'rounded-full', nombre: 'full', uso: 'Pastillas y avatares' },
];
