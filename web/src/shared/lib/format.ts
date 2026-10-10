const LOCALE = 'es-BO';

/** `0.743` → «74 %». */
export function formatPercent(share: number): string {
  return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(share);
}

/** Up to two decimals, with the Bolivian separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(value);
}

/** `1500, 'g'` → «1500 g». */
export function formatQuantity(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}

/**
 * `2026-10-04` → «4 oct 2026». Built from its parts: `new Date('2026-10-04')`
 * is read as UTC and shows the 3rd in Bolivia (UTC−4).
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

/** «hoy», «mañana», «en 5 días». */
export function formatDaysLeft(days: number): string {
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  return `en ${days} días`;
}
