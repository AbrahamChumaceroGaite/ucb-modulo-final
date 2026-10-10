import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { TONO_CLASES, type Tone } from '@/shared/config/variants';
import { Sparkline } from '../charts/sparkline';

/**
 * Cifra destacada, con su serie y su marca de fondo.
 *
 * El dato es el número; el icono es decoración y va al 7 % de opacidad, girado
 * y recortado contra el borde. Si el icono compitiera con la cifra, sobraría.
 *
 * La variación lleva flecha **y** signo: el color solo no basta para quien no
 * distingue verde de rojo.
 *
 * ## La serie, y dónde se equivocó
 *
 * `serie` dibuja la evolución **debajo** de la cifra (`fondo`) o a su derecha
 * (`lado`). Un número sin historia no dice si 42 es bueno.
 *
 * La primera versión la ponía *detrás* del texto, superpuesta y sin reservarle
 * espacio: el relleno de la curva se leía como un rectángulo gris flotando
 * sobre las palabras, y el detalle de abajo quedaba encima de la línea. Ahora
 * la curva tiene su propia banda al pie de la tarjeta, a sangre y recortada
 * por el borde curvo, y el contenido le deja el sitio.
 */
export function StatCard({
  etiqueta,
  valor,
  detalle,
  variacion,
  tono = 'primary',
  marca,
  serie,
  serieEn = 'fondo',
  className,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  /** Porcentaje ya formateado: `+12%`. El signo decide la dirección. */
  variacion?: string;
  tono?: Tone;
  marca?: ReactNode;
  /** Valores en orden cronológico. Con menos de dos no se dibuja nada. */
  serie?: readonly number[];
  serieEn?: 'fondo' | 'lado';
  className?: string;
}) {
  const clases = TONO_CLASES[tono];
  const sube = variacion?.trim().startsWith('+') ?? false;
  const hayCurva = Boolean(serie && serie.length > 1);
  const alLado = hayCurva && serieEn === 'lado';
  const alPie = hayCurva && serieEn === 'fondo';

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container',
        className,
      )}
    >
      {marca && !hayCurva && (
        <span
          className={cn(
            'marca-fondo -top-3 -right-4 rotate-12 opacity-[0.07] [&>svg]:size-24',
            clases.texto,
          )}
          aria-hidden
        >
          {marca}
        </span>
      )}

      <div className={cn('relative flex items-start gap-3 p-4', alLado && 'justify-between')}>
        <div className="min-w-0">
          <p className="label-caps text-on-surface-variant">{etiqueta}</p>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-on-surface" data-tabular>
              {valor}
            </span>

            {variacion && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  sube ? 'text-success' : 'text-error',
                )}
              >
                {sube ? (
                  <ArrowUpRight className="size-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3" aria-hidden />
                )}
                {variacion}
              </span>
            )}
          </div>

          {detalle && <p className="mt-1 text-xs text-on-surface-variant">{detalle}</p>}
        </div>

        {alLado && serie && (
          <Sparkline datos={serie} className={cn('h-12 w-24 shrink-0 self-center', clases.texto)} />
        )}
      </div>

      {/* Su propia banda, a sangre: la curva llega a los tres bordes y la
          recorta el radio de la tarjeta. `mt-auto` la pega abajo aunque la
          tarjeta de al lado sea más alta. */}
      {alPie && serie && <Sparkline datos={serie} className={cn('mt-auto h-12 w-full', clases.texto)} />}
    </article>
  );
}
