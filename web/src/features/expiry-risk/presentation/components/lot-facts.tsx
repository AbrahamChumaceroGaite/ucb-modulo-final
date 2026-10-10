import { cn } from '@/shared/lib/cn';
import { formatDate, formatDaysLeft, formatQuantity } from '@/shared/lib/format';
import { leftoverText } from '../../domain/lot-reading';
import type { LotRisk } from '../../domain/lot-risk.schema';

/** The inputs the model saw, in the product's own unit, and what would be left. */
export function LotFacts({ lot, className }: { lot: LotRisk; className?: string }) {
  const { unit } = lot.product;
  const facts = [
    { term: 'Vence', detail: `${formatDaysLeft(lot.daysToExpiry)} (${formatDate(lot.expiresOn)})` },
    { term: 'Queda', detail: `${formatQuantity(lot.remainingQuantity, unit)} de ${formatQuantity(lot.initialQuantity, unit)}` },
    { term: 'Por delante', detail: formatQuantity(lot.stockAhead, unit) },
    { term: 'Uso diario', detail: lot.usage7d === null ? 'Sin datos' : formatQuantity(lot.usage7d, unit) },
    { term: 'Sobra al vencer', detail: leftoverText(lot) },
  ];

  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3', className)}>
      {facts.map(({ term, detail }) => (
        <div key={term} className="min-w-0">
          <dt className="text-xs text-on-surface-variant">{term}</dt>
          <dd data-numeric className="text-sm text-on-surface">
            {detail}
          </dd>
        </div>
      ))}
    </dl>
  );
}
