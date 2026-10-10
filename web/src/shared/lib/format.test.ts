import { describe, expect, it } from 'vitest';
import { formatDate, formatDaysLeft, formatPercent, formatQuantity } from './format';

describe('format', () => {
  it('keeps a date-only value on its own day in Bolivia', () => {
    expect(formatDate('2026-10-04')).toBe('4 oct 2026');
  });

  it('rounds a probability to whole percent', () => {
    expect(formatPercent(0.7007)).toMatch(/^70\s?%$/);
  });

  it('writes a quantity with its unit and Bolivian decimals', () => {
    expect(formatQuantity(8.4286, 'und')).toBe('8,43 und');
  });

  it.each([
    [0, 'hoy'],
    [1, 'mañana'],
    [5, 'en 5 días'],
  ])('says %i days left as «%s»', (days, text) => {
    expect(formatDaysLeft(days)).toBe(text);
  });
});
