/**
 * Calendar dates as whole days, with no time zone.
 *
 * Dates travel as `YYYY-MM-DD` text. They are converted to a UTC day number
 * and never through `new Date('YYYY-MM-DD')` plus local getters: in La Paz
 * (UTC-4) that shows the previous day, the same trap the web documents in
 * `date-filter.tsx`.
 */
const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_POR_DIA = 86_400_000;

export function esFechaValida(texto: string): boolean {
  const partes = FORMATO.exec(texto);
  if (!partes) return false;
  const [, anio, mes, dia] = partes.map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/** Day number since 1970-01-01. Assumes `esFechaValida(texto)`. */
export function diaDe(texto: string): number {
  const [, anio, mes, dia] = (FORMATO.exec(texto) ?? []).map(Number);
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA;
}

export function textoDe(dia: number): string {
  return new Date(dia * MS_POR_DIA).toISOString().slice(0, 10);
}

/** Monday = 0 … Sunday = 6, like Python's `date.weekday()`. */
export function diaDeLaSemana(dia: number): number {
  return (new Date(dia * MS_POR_DIA).getUTCDay() + 6) % 7;
}
