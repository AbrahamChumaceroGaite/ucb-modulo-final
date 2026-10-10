import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/**
 * Hueco para crear. Cierra la rejilla en vez de dejarla cortada.
 *
 * Es un `<button>`, no un `<div>` con `onClick`: se alcanza tabulando y se
 * activa con Enter o espacio, como cualquier otra acción. El trazo discontinuo
 * dice que aquí todavía no hay nada, y por eso no lleva ni acento ni marca de
 * fondo: no representa ningún registro.
 *
 * Vive en su propio archivo y no junto a `EntityCard` porque **no es una
 * tarjeta de registro**: comparten sitio en la rejilla y nada más. Estuvieron
 * en el mismo archivo y lo único que producía era un archivo con dos cosas.
 */
export function AddCard({
  titulo,
  descripcion,
  onClick,
  className,
}: {
  titulo: string;
  descripcion?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl px-5 py-6 text-center',
        'border border-dashed border-outline-variant bg-transparent',
        'transition-colors duration-200 hover:border-primary hover:bg-surface-container/60',
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
        <Plus className="size-4" aria-hidden />
      </span>

      <span className="text-sm font-semibold text-on-surface">{titulo}</span>
      {descripcion && (
        <span className="max-w-[18rem] text-xs text-on-surface-variant">{descripcion}</span>
      )}
    </button>
  );
}
