import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  outline: 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline',
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  icon?: ReactNode;
  /** Swaps the label for three dots and blocks a second click. */
  loading?: boolean;
}

export function Button({ variant = 'outline', icon, loading = false, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap',
        'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="loading-dots inline-flex gap-1" role="status" aria-label="Procesando">
          <span className="size-1.5 rounded-full bg-current" />
          <span className="size-1.5 rounded-full bg-current" />
          <span className="size-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
