'use client';

import { useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { useGuidedTour } from '@/shared/hooks/use-guided-tour';
import { formatDate } from '@/shared/lib/format';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { useEvaluateLot } from '../application/use-evaluate-lot';
import { useLotFilters } from '../application/use-lot-filters';
import { useLotRisks } from '../application/use-lot-risks';
import { useRiskModel } from '../application/use-risk-model';
import { emptyForm, formFromLot, type EvaluateLotForm } from '../domain/evaluate-lot.schema';
import { hasFilters } from '../domain/lot-filters';
import type { LotRisk } from '../domain/lot-risk.schema';
import { EvaluationPanel } from './components/evaluation-panel';
import { LotFilters } from './components/lot-filters';
import { LotResults } from './components/lot-results';
import { ModelSummary } from './components/model-summary';
import { EXPIRY_RISK_TOUR, TOUR } from './expiry-risk.tour';

/** Open lots ranked by the model, a form to try any lot, and how far to trust both. */
export function ExpiryRiskView() {
  const lotFilters = useLotFilters();
  const lots = useLotRisks(lotFilters.filters);
  const model = useRiskModel();
  const evaluation = useEvaluateLot();
  const [copied, setCopied] = useState<{ count: number; values: EvaluateLotForm } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const startTour = useGuidedTour(EXPIRY_RISK_TOUR);

  const reviewedOn = lots.data?.reviewedOn ?? null;

  const tryLot = (lot: LotRisk) => {
    setCopied((current) => ({ count: (current?.count ?? 0) + 1, values: formFromLot(lot) }));
    evaluation.reset();
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Lotes por vencer</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            {reviewedOn ? `Mañana del ${formatDate(reviewedOn)}. ` : ''}
            Arriba, los lotes con más riesgo de vencer sin terminarse.
          </p>
        </div>
        {/* The tour needs the lots on screen to point at them. */}
        <Button icon={<CircleHelp className="size-4" aria-hidden />} disabled={!lots.data || !model.data} onClick={startTour}>
          Cómo funciona
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="lots-title" className="flex min-w-0 flex-col gap-4">
          <h2 id="lots-title" className="text-lg font-semibold text-on-surface">
            Lotes abiertos
          </h2>
          <LotFilters
            level={lotFilters.filters.level}
            family={lotFilters.filters.family}
            searchText={lotFilters.searchText}
            onLevel={lotFilters.setLevel}
            onFamily={lotFilters.setFamily}
            onSearch={lotFilters.setSearchText}
          />
          <LotResults
            page={lots.data}
            refreshing={lots.isPlaceholderData}
            error={lots.error}
            filtered={hasFilters(lotFilters.filters)}
            onRetry={() => void lots.refetch()}
            onClear={lotFilters.clear}
            onTry={tryLot}
            onPage={lotFilters.goTo}
          />
        </section>

        <section ref={panelRef} aria-labelledby="evaluate-title" data-tour={TOUR.evaluate} className="flex min-w-0 scroll-mt-6 flex-col gap-3">
          <h2 id="evaluate-title" className="text-lg font-semibold text-on-surface">
            Evaluar un lote
          </h2>
          <p className="text-sm text-on-surface-variant">
            Prueba con un lote propio o con uno de la lista. No se guarda nada.
          </p>
          {model.error ? (
            <ErrorNotice title="No se pudo cargar el modelo" error={model.error} onRetry={() => void model.refetch()} />
          ) : null}
          {model.data && !lots.isPending ? (
            <EvaluationPanel
              products={model.data.products}
              formKey={String(copied?.count ?? 0)}
              defaultValues={copied?.values ?? emptyForm(reviewedOn ?? '')}
              pending={evaluation.isPending}
              error={evaluation.error}
              result={evaluation.data}
              onSubmit={(request) => evaluation.mutate(request)}
              onInvalid={evaluation.reset}
            />
          ) : null}
          {!model.error && (!model.data || lots.isPending) ? <Skeleton className="h-96" /> : null}
        </section>
      </div>

      <section aria-labelledby="model-title" data-tour={TOUR.model} className="flex flex-col gap-3 border-t pt-6">
        <h2 id="model-title" className="text-lg font-semibold text-on-surface">
          Qué tan bien funciona
        </h2>
        {model.data ? <ModelSummary card={model.data} /> : null}
      </section>
    </div>
  );
}
