import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export const TONES = {
  danger: 'bg-error-container text-error',
  warning: 'bg-warning-container text-warning',
  success: 'bg-success-container text-success',
  neutral: 'bg-surface-container-high text-on-surface-variant',
} as const;

export type Tone = keyof typeof TONES;

export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone])}>
      {children}
    </span>
  );
}
