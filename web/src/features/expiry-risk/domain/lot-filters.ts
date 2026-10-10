import type { Family, RiskLevel } from './lot-risk.schema';

export const PAGE_SIZE = 10;

export interface LotFilters {
  level: RiskLevel | null;
  family: Family | null;
  search: string;
  skip: number;
}

export const NO_FILTERS: LotFilters = { level: null, family: null, search: '', skip: 0 };

export function hasFilters(filters: LotFilters): boolean {
  return filters.level !== null || filters.family !== null || filters.search !== '';
}

/** Query string of `GET /lot-risk`. Empty filters are left out, not sent blank. */
export function toQueryString(filters: LotFilters): string {
  const params = new URLSearchParams({ skip: String(filters.skip), limit: String(PAGE_SIZE) });
  if (filters.level) params.set('level', filters.level);
  if (filters.family) params.set('family', filters.family);
  if (filters.search) params.set('search', filters.search);
  return params.toString();
}

/** «1–10 de 17». */
export function pageRange(skip: number, shown: number, total: number): string {
  if (total === 0) return '0 de 0';
  return `${skip + 1}–${skip + shown} de ${total}`;
}
