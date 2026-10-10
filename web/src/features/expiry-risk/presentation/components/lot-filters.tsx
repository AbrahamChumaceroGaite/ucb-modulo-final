import { cn } from '@/shared/lib/cn';
import { Field, controlClass } from '@/shared/ui/field';
import { FAMILY_LABEL, LEVEL_LABEL } from '../../domain/lot-reading';
import { FAMILIES, RISK_LEVELS, type Family, type RiskLevel } from '../../domain/lot-risk.schema';
import { TOUR } from '../expiry-risk.tour';

const LEVEL_OPTIONS = [{ value: null, label: 'Todos' }, ...RISK_LEVELS.map((value) => ({ value, label: LEVEL_LABEL[value] }))];

interface LotFiltersProps {
  level: RiskLevel | null;
  family: Family | null;
  searchText: string;
  onLevel: (level: RiskLevel | null) => void;
  onFamily: (family: Family | null) => void;
  onSearch: (text: string) => void;
}

export function LotFilters({ level, family, searchText, onLevel, onFamily, onSearch }: LotFiltersProps) {
  return (
    <div data-tour={TOUR.filters} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Buscar producto">
          <input
            type="search"
            value={searchText}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Leche, tomate, croissant…"
            className={controlClass}
          />
        </Field>
        <Field label="Familia">
          <select
            value={family ?? ''}
            onChange={(event) => onFamily(asFamily(event.target.value))}
            className={controlClass}
          >
            <option value="">Todas</option>
            {FAMILIES.map((value) => (
              <option key={value} value={value}>
                {FAMILY_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div role="group" aria-label="Nivel de riesgo" className="flex flex-wrap gap-2">
        {LEVEL_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={level === option.value}
            onClick={() => onLevel(option.value)}
            className={cn(
              'h-11 cursor-pointer rounded-full border px-4 text-sm transition-colors duration-150',
              level === option.value
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function asFamily(value: string): Family | null {
  return FAMILIES.find((family) => family === value) ?? null;
}
