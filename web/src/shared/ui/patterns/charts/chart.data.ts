/**
 * Configuración compartida por los tres gráficos: paleta, ejes y tooltip.
 *
 * Los colores salen de los tokens del tema, no de la paleta de la librería.
 * Auditamos un proyecto cuyos gráficos usaban 34 variables CSS que no existían
 * —`--p-purple-500` con 46 usos—, así que media paleta no pintaba nada.
 */

export const COLORES_SERIE = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-success)',
  'var(--color-warning)',
] as const;

export const EJE = {
  stroke: 'var(--color-on-surface-variant)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const ESTILO_TOOLTIP = {
  contentStyle: {
    backgroundColor: 'var(--color-surface-container-highest)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    color: 'var(--color-on-surface)',
  },
  labelStyle: { color: 'var(--color-on-surface-variant)' },
  cursor: { fill: 'var(--color-on-surface)', fillOpacity: 0.04 },
} as const;
