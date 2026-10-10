import { cn } from '@/shared/lib/cn';

/**
 * Tres puntos que indican trabajo en curso.
 *
 * Sustituye al spinner, que está prohibido: un círculo girando no dice ni qué
 * se está haciendo ni cuánto falta. Para carga de contenido va `<Skeleton>`,
 * que además reserva el espacio exacto; esto es para acciones dentro de un
 * botón, donde no hay forma ni tamaño que reservar.
 */
export function Dots({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      className={cn('puntos-carga inline-flex items-center gap-1', className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Procesando'}
    >
      <span className="size-1.5 rounded-full bg-current" />
      <span className="size-1.5 rounded-full bg-current" />
      <span className="size-1.5 rounded-full bg-current" />
    </span>
  );
}
