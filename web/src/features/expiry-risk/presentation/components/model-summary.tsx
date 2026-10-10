import { formatDate, formatNumber, formatPercent } from '@/shared/lib/format';
import { solutionLimits } from '../../domain/lot-reading';
import type { ModelCard } from '../../domain/lot-risk.schema';
import { METRIC_ROWS } from './model-summary.data';

/** How the model was measured against the baseline, and what it cannot do. */
export function ModelSummary({ card }: { card: ModelCard }) {
  const { train, validation, test } = card.partitions;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-on-surface-variant">
          Modelo y regla probados con los mismos {formatNumber(test.lots)} lotes ({formatDate(test.from)} a{' '}
          {formatDate(test.to)}). El modelo aprendió de otros {formatNumber(train.lots)} y el umbral se ajustó con{' '}
          {formatNumber(validation.lots)} más.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Métrica en prueba</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Regla</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Modelo</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((row) => (
                <tr key={row.key} className="border-t">
                  <th scope="row" className="px-3 py-2 font-normal">
                    <span className="text-on-surface">{row.label}</span>
                    <span className="block text-xs text-on-surface-variant">{row.note}</span>
                  </th>
                  <td className="px-3 py-2 text-right">{formatPercent(card.metrics.rule[row.key])}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatPercent(card.metrics.model[row.key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-on-surface-variant">
          Se avisa desde {formatPercent(card.threshold)} de riesgo: la raya de cada barra. Con ese umbral se buscó avisar
          de al menos el {formatPercent(card.targetRecall)} de los lotes que vencen.
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-on-surface">Límites</h3>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-sm text-on-surface-variant">
          {solutionLimits(card).map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
