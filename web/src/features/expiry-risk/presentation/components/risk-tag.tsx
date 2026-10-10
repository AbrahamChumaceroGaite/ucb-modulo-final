import { Tag, type Tone } from '@/shared/ui/tag';
import { LEVEL_LABEL } from '../../domain/lot-reading';
import type { RiskLevel } from '../../domain/lot-risk.schema';

const TONE: Record<RiskLevel, Tone> = { high: 'danger', watch: 'warning', low: 'success' };

export function RiskTag({ level }: { level: RiskLevel }) {
  return <Tag tone={TONE[level]}>{LEVEL_LABEL[level]}</Tag>;
}
