'use client';

import { useEffect, useState } from 'react';
import { NO_FILTERS, type LotFilters } from '../domain/lot-filters';
import type { Family, RiskLevel } from '../domain/lot-risk.schema';

const SEARCH_DELAY_MS = 300;

/**
 * Filter state of the lot list. Any filter change goes back to the first
 * page; the search box waits for a pause in typing before asking the API.
 */
export function useLotFilters() {
  const [filters, setFilters] = useState<LotFilters>(NO_FILTERS);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const search = searchText.trim();
    const timer = setTimeout(
      () => setFilters((current) => (current.search === search ? current : { ...current, search, skip: 0 })),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [searchText]);

  return {
    filters,
    searchText,
    setSearchText,
    setLevel: (level: RiskLevel | null) => setFilters((current) => ({ ...current, level, skip: 0 })),
    setFamily: (family: Family | null) => setFilters((current) => ({ ...current, family, skip: 0 })),
    goTo: (skip: number) => setFilters((current) => ({ ...current, skip })),
    clear: () => {
      setSearchText('');
      setFilters(NO_FILTERS);
    },
  };
}
