import { cn } from '@/shared/lib/cn';

/**
 * Hueco mientras llegan los datos.
 *
 * Sustituye al spinner, que está prohibido. La diferencia no es estética: el
 * skeleton **reserva el espacio exacto** del contenido real, así que la página
 * no da un salto cuando los datos llegan. Un spinner deja un hueco que luego se
 * rellena de golpe.
 *
 * No parpadea: una veta de luz lo recorre. El parpadeo cansa la vista en una
 * pantalla que se mira todo el día.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('kh-skeleton rounded-sm bg-surface-container-high', className)}
      aria-hidden
    />
  );
}

/** Líneas de texto. La última es más corta, como lo sería un párrafo real. */
export function SkeletonText({ lineas = 3, className }: { lineas?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lineas }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lineas - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * Tarjeta con la misma anatomía que `<EntityCard>`: miniatura, cuerpo y pie.
 *
 * Las medidas se copian de ella a propósito —miniatura de 40 px, radio `xl`—:
 * si el esqueleto y la tarjeta no miden lo mismo, la pantalla da un salto justo
 * cuando llegan los datos, que es el momento en que más se nota.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-outline-variant bg-surface-container p-4', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
    </div>
  );
}

/**
 * Filas de tabla. `columnas` debe coincidir con las de la tabla real para que
 * el ancho no cambie al llegar los datos.
 */
export function SkeletonRows({ filas = 5, columnas = 4 }: { filas?: number; columnas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, fila) => (
        <tr key={fila} className="border-b border-outline-variant/50">
          {Array.from({ length: columnas }).map((_, col) => (
            <td key={col} className="px-3 py-2.5">
              <Skeleton className={cn('h-3', col === 0 ? 'w-32' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Campos de formulario: etiqueta corta y control debajo. */
export function SkeletonForm({ campos = 4 }: { campos?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: campos }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
