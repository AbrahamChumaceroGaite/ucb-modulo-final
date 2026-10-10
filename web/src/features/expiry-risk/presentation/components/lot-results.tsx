import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { Notice } from '@/shared/ui/notice';
import { Skeleton } from '@/shared/ui/skeleton';
import { PAGE_SIZE, pageRange } from '../../domain/lot-filters';
import type { LotRisk, LotRiskPage } from '../../domain/lot-risk.schema';
import { LotCard } from './lot-card';

interface LotResultsProps {
  page: LotRiskPage | undefined;
  /** A different page or filter is on its way; the current one stays visible. */
  refreshing: boolean;
  error: unknown;
  filtered: boolean;
  onRetry: () => void;
  onClear: () => void;
  onTry: (lot: LotRisk) => void;
  onPage: (skip: number) => void;
}

export function LotResults({ page, refreshing, error, filtered, onRetry, onClear, onTry, onPage }: LotResultsProps) {
  if (error && !page) return <ErrorNotice title="No se cargó la lista" error={error} onRetry={onRetry} />;

  if (!page) {
    return (
      <div role="status" aria-label="Cargando lotes" className="flex flex-col gap-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-56" />
        ))}
      </div>
    );
  }

  if (page.total === 0) {
    return filtered ? (
      <Notice title="Ningún lote coincide con los filtros" action={<Button onClick={onClear}>Quitar filtros</Button>} />
    ) : (
      <Notice title="No hay lotes perecederos abiertos" />
    );
  }

  return (
    <div aria-busy={refreshing} className={cn('flex flex-col gap-3 transition-opacity', refreshing && 'opacity-60')}>
      <ul className="flex flex-col gap-3">
        {page.data.map((lot) => (
          <li key={lot.lotId ?? lot.product.id}>
            <LotCard lot={lot} onTry={onTry} />
          </li>
        ))}
      </ul>
      <nav aria-label="Páginas de lotes" className="flex flex-wrap items-center justify-between gap-2">
        <p data-numeric className="text-sm text-on-surface-variant">
          {pageRange(page.skip, page.data.length, page.total)}
        </p>
        <div className="flex gap-2">
          <Button disabled={page.skip === 0} onClick={() => onPage(Math.max(0, page.skip - PAGE_SIZE))}>
            Anteriores
          </Button>
          <Button disabled={!page.hasMore} onClick={() => onPage(page.skip + PAGE_SIZE)}>
            Siguientes
          </Button>
        </div>
      </nav>
    </div>
  );
}
