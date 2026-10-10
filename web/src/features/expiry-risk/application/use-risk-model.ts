'use client';

import { useQuery } from '@tanstack/react-query';
import { expiryRiskApi } from '../infrastructure/expiry-risk.api';

/** The model card does not change while the API runs. */
export function useRiskModel() {
  return useQuery({
    queryKey: ['risk-model'],
    queryFn: expiryRiskApi.getModelCard,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
