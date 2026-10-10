import { cn } from '@/shared/lib/cn';
import { formatPercent } from '@/shared/lib/format';
import type { RiskLevel } from '../../domain/lot-risk.schema';

const FILL: Record<RiskLevel, string> = { high: 'bg-error', watch: 'bg-warning', low: 'bg-success' };

/** The model's probability as a bar; the tick is the warning threshold, explained once in the model summary. */
export function ProbabilityMeter({ probability, threshold, level }: { probability: number; threshold: number; level: RiskLevel }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs text-on-surface-variant">
        <span>Riesgo de vencer</span>
        <span data-numeric className="text-base font-semibold text-on-surface">
          {formatPercent(probability)}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Riesgo de vencer"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(probability * 100)}
        aria-valuetext={formatPercent(probability)}
        className="relative mt-1 h-2 rounded-full bg-surface-container-high"
      >
        <div className={cn('h-full rounded-full', FILL[level])} style={{ width: `${probability * 100}%` }} />
        <div aria-hidden className="absolute -top-1 h-4 w-0.5 rounded-full bg-on-surface" style={{ left: `${threshold * 100}%` }} />
      </div>
    </div>
  );
}
