import { cn } from '@/shared/lib/cn';
import { ruleSentence } from '../../domain/lot-reading';
import type { LotRisk } from '../../domain/lot-risk.schema';
import { ProbabilityMeter } from './probability-meter';

/** What the model says about a lot, next to what the coverage rule would say. */
export function LotReading({ lot, className }: { lot: LotRisk; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <ProbabilityMeter probability={lot.probability} threshold={lot.threshold} level={lot.level} />
      <p className="text-xs text-on-surface-variant">{ruleSentence(lot.coverageRule)}</p>
    </div>
  );
}
