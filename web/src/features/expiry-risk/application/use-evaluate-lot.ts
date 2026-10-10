'use client';

import { useMutation } from '@tanstack/react-query';
import { expiryRiskApi } from '../infrastructure/expiry-risk.api';

/** Runs the model on a lot typed by hand. Nothing is stored. */
export function useEvaluateLot() {
  return useMutation({ mutationFn: expiryRiskApi.evaluateLot });
}
