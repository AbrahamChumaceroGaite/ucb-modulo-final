import { describe, expect, it } from 'vitest';
import { NO_FILTERS, hasFilters, pageRange, toQueryString } from './lot-filters';

describe('toQueryString', () => {
  it('sends only the page when nothing is filtered', () => {
    expect(toQueryString(NO_FILTERS)).toBe('skip=0&limit=10');
  });

  it('adds each filter that has a value', () => {
    expect(toQueryString({ level: 'high', family: 'dairy', search: 'leche pil', skip: 10 })).toBe(
      'skip=10&limit=10&level=high&family=dairy&search=leche+pil',
    );
  });
});

describe('hasFilters', () => {
  it('ignores the page number', () => {
    expect(hasFilters({ ...NO_FILTERS, skip: 20 })).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, search: 'tomate' })).toBe(true);
  });
});

describe('pageRange', () => {
  it.each([
    [0, 10, 17, '1–10 de 17'],
    [10, 7, 17, '11–17 de 17'],
    [0, 0, 0, '0 de 0'],
  ])('skip %i, %i shown, %i total → %s', (skip, shown, total, text) => {
    expect(pageRange(skip, shown, total)).toBe(text);
  });
});
