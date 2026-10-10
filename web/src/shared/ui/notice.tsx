import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** A boxed message: an error with its retry, an empty list, a limit to keep in mind. */
export function Notice({
  title,
  children,
  action,
  tone = 'neutral',
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-start gap-2 rounded-md border p-4',
        tone === 'error' ? 'border-error/40 bg-error-container/40' : 'border-outline-variant bg-surface-container-low',
      )}
    >
      <p className={cn('text-sm font-semibold', tone === 'error' ? 'text-error' : 'text-on-surface')}>{title}</p>
      {children && <div className="text-sm text-on-surface-variant">{children}</div>}
      {action}
    </div>
  );
}
