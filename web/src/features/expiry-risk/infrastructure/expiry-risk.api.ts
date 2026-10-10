import { http } from '@/shared/api/http-client';
import type { EvaluateLotRequest } from '../domain/evaluate-lot.schema';
import { toQueryString, type LotFilters } from '../domain/lot-filters';
import { lotRiskPageSchema, lotRiskSchema, modelCardSchema } from '../domain/lot-risk.schema';

export const expiryRiskApi = {
  listLots: (filters: LotFilters) => http.get(`/lot-risk?${toQueryString(filters)}`, lotRiskPageSchema),
  evaluateLot: (request: EvaluateLotRequest) => http.post('/lot-risk/evaluate', request, lotRiskSchema),
  getModelCard: () => http.get('/risk-model', modelCardSchema),
};
