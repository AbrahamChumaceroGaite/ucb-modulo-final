'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface OpcionSegmento<V extends string> {
  valor: V;
  /** Puede ir vacía si la opción es solo icono; entonces `titulo` es obligatorio. */
  etiqueta: string;
  /** Nombre de la opción cuando el icono va solo: lo lee el lector y el `title`. */
  titulo?: string;
  icono?: ReactNode;
}

/**
 * Interruptor segmentado: dos o tres opciones excluyentes, siempre una activa.
 *
 * ## Por qué son radios de verdad
 *
 * Por dentro son `<input type="radio">` con un `name` compartido. Eso trae
 * gratis lo que un grupo de `<button>` obliga a escribir a mano y casi nadie
 * escribe: navegación con flechas, anuncio de «1 de 2» en el lector de
 * pantalla y participación en el envío del formulario. En la librería que
 * auditamos el equivalente eran `div`s con `onClick` y no había forma de
 * cambiar de opción sin ratón.
 *
 * ## Sin relleno ni borde
 *
 * La pastilla ocupa el alto entero y llega a los extremos. Con relleno interno
 * quedaba un anillo del color del contenedor asomando alrededor de la pastilla
 * —en el tema oscuro se leía como un borde rojizo— y el control parecía un
 * botón mal encajado dentro de otro.
 *
 * ## La burbuja
 *
 * Dos capas: la exterior se desplaza con una curva que se pasa del destino y
 * vuelve, la interior se deforma —se estira en el sentido de la marcha y
 * rebota al llegar—. Se remonta con `key` para que la deformación se repita en
 * cada cambio; con una transición sola el movimiento es correcto pero muerto.
 *
 * No es un sustituto del `Select`: por encima de tres opciones la fila se
 * estrecha y las etiquetas se parten. Para más, `Select`.
 */
export function SegmentedControl<V extends string>({
  opciones,
  valor,
  onCambiar,
  etiquetaGrupo,
  medida = 'sm',
  className,
}: {
  opciones: readonly OpcionSegmento<V>[];
  valor: V;
  onCambiar: (valor: V) => void;
  /** Qué se está eligiendo. Lo lee el lector de pantalla antes de las opciones. */
  etiquetaGrupo: string;
  medida?: 'sm' | 'md';
  className?: string;
}) {
  const nombre = useId();
  const total = opciones.length;
  const indice = Math.max(
    0,
    opciones.findIndex((opcion) => opcion.valor === valor),
  );

  return (
    <div
      role="radiogroup"
      aria-label={etiquetaGrupo}
      className={cn(
        // Un velo del propio color del texto, no un token de superficie: las
        // superficies de Kaffehaus van tintadas en tostado y sobre la tarjeta
        // el carril se leía rojizo. Al 8 % del texto queda neutro y funciona
        // igual en los dos temas.
        'relative grid overflow-hidden rounded-full bg-on-surface/8',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {/* La pastilla. `aria-hidden` porque el estado ya lo dice el radio
          marcado: anunciarlo dos veces sería ruido. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 transition-transform duration-300 ease-[var(--ease-burbuja)]"
        style={{ width: `${100 / total}%`, transform: `translateX(${indice * 100}%)` }}
      >
        <span
          key={valor}
          className="block size-full rounded-full bg-primary animate-[kh-burbuja_320ms_var(--ease-burbuja)]"
        />
      </span>

      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;

        return (
          <label
            key={opcion.valor}
            title={opcion.titulo}
            className={cn(
              'relative z-10 flex cursor-pointer items-center justify-center gap-1.5 rounded-full',
              'font-medium transition-colors duration-200 select-none',
              // El anillo de foco se pinta en la etiqueta porque el radio está
              // oculto: sin esto, tabular por el grupo no se vería.
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary',
              medida === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
              // Solo icono: cuadrado, para que la pastilla salga redonda.
              opcion.etiqueta ? (medida === 'sm' ? 'px-3' : 'px-4') : 'aspect-square',
              activa ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            <input
              type="radio"
              name={nombre}
              value={opcion.valor}
              // Sin texto visible el radio no tiene nombre accesible: el
              // `title` del icono no cuenta como etiqueta de un control.
              aria-label={opcion.etiqueta || opcion.titulo}
              checked={activa}
              onChange={() => onCambiar(opcion.valor)}
              className="sr-only"
            />
            {opcion.icono}
            {opcion.etiqueta}
          </label>
        );
      })}
    </div>
  );
}
