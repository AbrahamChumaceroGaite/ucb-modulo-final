'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LotFilters } from '../domain/lot-filters';
import { expiryRiskApi } from '../infrastructure/expiry-risk.api';

/** Open lots with their risk. While a new filter loads, the previous page stays on screen. */
export function useLotRisks(filters: LotFilters) {
  return useQuery({
    queryKey: ['lot-risk', filters],
    queryFn: () => expiryRiskApi.listLots(filters),
    placeholderData: keepPreviousData,
  });
}
