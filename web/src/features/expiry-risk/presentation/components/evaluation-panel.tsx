'use client';

import { ErrorNotice } from '@/shared/ui/error-notice';
import type { EvaluateLotForm as FormValues, EvaluateLotRequest } from '../../domain/evaluate-lot.schema';
import type { CatalogProduct, LotRisk } from '../../domain/lot-risk.schema';
import { EvaluateLotForm } from './evaluate-lot-form';
import { EvaluationResult } from './evaluation-result';

interface EvaluationPanelProps {
  products: CatalogProduct[];
  /** Changes when a lot is copied from the list, so the form starts over with its values. */
  formKey: string;
  defaultValues: FormValues;
  pending: boolean;
  error: unknown;
  result: LotRisk | undefined;
  onSubmit: (request: EvaluateLotRequest) => void;
  onInvalid: () => void;
}

export function EvaluationPanel({ products, formKey, defaultValues, pending, error, result, onSubmit, onInvalid }: EvaluationPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <EvaluateLotForm key={formKey} products={products} defaultValues={defaultValues} pending={pending} onSubmit={onSubmit} onInvalid={onInvalid} />
      {error ? <ErrorNotice title="No se pudo evaluar" error={error} /> : null}
      {result && !error ? <EvaluationResult result={result} /> : null}
    </div>
  );
}
