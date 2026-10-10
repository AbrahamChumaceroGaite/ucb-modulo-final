import { useId } from 'react';
import { FlaskConical } from 'lucide-react';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { FAMILY_LABEL } from '../../domain/lot-reading';
import type { LotRisk } from '../../domain/lot-risk.schema';
import { LotFacts } from './lot-facts';
import { LotReading } from './lot-reading';
import { TOUR } from '../expiry-risk.tour';
import { RiskTag } from './risk-tag';

export function LotCard({ lot, onTry }: { lot: LotRisk; onTry: (lot: LotRisk) => void }) {
  const titleId = useId();
  return (
    <article aria-labelledby={titleId} data-tour={TOUR.lot} className="rounded-md border bg-surface-container-lowest p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={titleId} className="font-semibold text-on-surface">
            {lot.product.name}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {FAMILY_LABEL[lot.product.family]} · ingresó el {formatDate(lot.receivedOn)}
          </p>
        </div>
        <RiskTag level={lot.level} />
      </header>
      <div data-tour={TOUR.facts} className="mt-3">
        <LotFacts lot={lot} />
      </div>
      <div data-tour={TOUR.risk} className="mt-3">
        <LotReading lot={lot} />
      </div>
      <Button variant="ghost" data-tour={TOUR.tryLot} className="mt-2 -ml-2" icon={<FlaskConical className="size-4" aria-hidden />} onClick={() => onTry(lot)}>
        Probar cambios
      </Button>
    </article>
  );
}
