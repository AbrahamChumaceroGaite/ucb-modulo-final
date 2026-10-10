import { cn } from '@/shared/lib/cn';
import { TONO_CLASES, type Tone } from '@/shared/config/variants';

/**
 * Barra de nivel. La usa el inventario para el stock y cualquier cosa que sea
 * «cuánto hay de cuánto».
 *
 * Lleva `role="progressbar"` con sus valores, así que un lector de pantalla
 * anuncia la cifra aunque la barra sea puramente visual.
 *
 * El tono lo decide quien la usa, no la barra: el umbral de «crítico» es una
 * regla de negocio y no pertenece a un componente de presentación.
 */
export function ProgressBar({
  valor,
  maximo,
  tono = 'primary',
  etiqueta,
  className,
}: {
  valor: number;
  maximo: number;
  tono?: Tone;
  etiqueta?: string;
  className?: string;
}) {
  const porcentaje = maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-label={etiqueta}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', TONO_CLASES[tono].solido)}
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}
