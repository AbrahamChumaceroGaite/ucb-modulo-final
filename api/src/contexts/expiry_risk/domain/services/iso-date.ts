/**
 * Calendar dates as whole days, with no time zone.
 *
 * Dates travel as `YYYY-MM-DD` text and become a UTC day number. Never
 * through `new Date('YYYY-MM-DD')` plus local getters: in La Paz (UTC-4) that
 * shows the previous day.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isIsoDate(text: string): boolean {
  const parts = ISO_DATE.exec(text);
  if (!parts) return false;
  const [, year, month, day] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Day number since 1970-01-01. Assumes `isIsoDate(text)`. */
export function dayNumber(text: string): number {
  const [, year, month, day] = (ISO_DATE.exec(text) ?? []).map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function isoDate(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Monday = 0 … Sunday = 6, like Python's `date.weekday()`. */
export function weekday(day: number): number {
  return (new Date(day * MS_PER_DAY).getUTCDay() + 6) % 7;
}
