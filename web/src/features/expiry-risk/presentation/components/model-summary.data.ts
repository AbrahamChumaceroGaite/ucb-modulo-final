import type { ModelMetrics } from '../../domain/lot-risk.schema';

interface MetricRow {
  key: keyof ModelMetrics;
  label: string;
  note: string;
}

/** Rows of the comparison table, main metric first. */
export const METRIC_ROWS: MetricRow[] = [
  { key: 'recall', label: 'Recall', note: 'La principal. Lotes que vencieron con saldo y se avisaron.' },
  { key: 'accuracy', label: 'Accuracy', note: 'Aciertos sobre todas las revisiones.' },
  { key: 'precision', label: 'Precisión', note: 'Avisos que de verdad vencieron.' },
  { key: 'earlyWarning2Days', label: 'Aviso con 2 días o más', note: 'Lotes vencidos avisados con margen para usarlos.' },
];
