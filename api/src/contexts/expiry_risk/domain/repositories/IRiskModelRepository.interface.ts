import type { RiskModel } from '../entities/risk-model.entity';

export const RISK_MODEL_REPOSITORY = 'IRiskModelRepository';

/** Source of the trained model, loaded once at startup. */
export interface IRiskModelRepository {
  get(): RiskModel;
}
