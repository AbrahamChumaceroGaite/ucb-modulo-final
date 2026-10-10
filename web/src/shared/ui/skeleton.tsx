import { cn } from '@/shared/lib/cn';

/** Placeholder with the size of what is loading, so the page does not jump when it arrives. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-sm', className)} aria-hidden />;
}
