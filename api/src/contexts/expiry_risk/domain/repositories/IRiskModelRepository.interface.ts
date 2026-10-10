import type { RiskModel } from '../entities/risk-model.entity';

export const RISK_MODEL_REPOSITORY = 'IRiskModelRepository';

/** Where the trained model comes from. Loaded once; never written. */
export interface IRiskModelRepository {
  get(): RiskModel;
}
