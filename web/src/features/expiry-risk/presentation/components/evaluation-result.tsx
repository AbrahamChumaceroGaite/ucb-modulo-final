import { decisionSentence } from '../../domain/lot-reading';
import type { LotRisk } from '../../domain/lot-risk.schema';
import { LotFacts } from './lot-facts';
import { LotReading } from './lot-reading';
import { RiskTag } from './risk-tag';

/** The model's answer for a lot typed by hand. */
export function EvaluationResult({ result }: { result: LotRisk }) {
  return (
    <section aria-label="Resultado de la evaluación" className="rounded-md border border-outline bg-surface-container-lowest p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-on-surface">{result.product.name}</h3>
        <RiskTag level={result.level} />
      </header>
      <p className="mt-1 text-sm text-on-surface">{decisionSentence(result.atRisk)}</p>
      <LotFacts lot={result} className="mt-3 sm:grid-cols-2" />
      <LotReading lot={result} className="mt-3" />
    </section>
  );
}
