import type { Page } from '@libs/application';
import type { Family } from '../../domain/services/features';
import type { RiskLevel } from '../../domain/value_objects/risk-level.vo';

/** The model card leaves the API as the domain defines it. */
export type { ModelCard } from '../../domain/entities/risk-model.entity';

export interface LotRiskResponse {
  /** `null` for a lot typed by hand: it does not exist in the inventory. */
  lotId: string | null;
  product: { id: string; name: string; family: Family; unit: string };
  receivedOn: string;
  expiresOn: string;
  reviewedOn: string;
  daysToExpiry: number;
  initialQuantity: number;
  remainingQuantity: number;
  stockAhead: number;
  usage7d: number | null;
  usage28d: number | null;
  probability: number;
  threshold: number;
  atRisk: boolean;
  level: RiskLevel;
  coverageRule: boolean | null;
  coverageDays: number | null;
  estimatedLeftover: number | null;
  modelVersion: string;
}

export interface LotRiskPage extends Page<LotRiskResponse> {
  /** The morning the list was computed for; `null` when the database has no movements. */
  reviewedOn: string | null;
}
