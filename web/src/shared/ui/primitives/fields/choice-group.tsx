'use client';

import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type Opcion<V extends string> = {
  valor: V;
  etiqueta: string;
  /** Para qué sirve esta opción. Es lo que convierte una lista en una decisión. */
  detalle?: string;
  icono?: ReactNode;
};

/**
 * Lista de opciones con su explicación, en fichas pulsables.
 *
 * ## Por qué no un `<Select>`
 *
 * Un desplegable de dos opciones esconde ambas y pide un clic para ver lo que
 * ya cabía en pantalla. Y sobre todo: **no tiene sitio para el porqué**. Elegir
 * entre «Administrador» y «Operador» sin saber qué puede hacer cada uno es
 * adivinar; con una línea de detalle al lado, es una decisión.
 *
 * ## Radios y casillas de verdad
 *
 * Por dentro son `<input type="radio">` o `<input type="checkbox">` nativos,
 * envueltos en `<label>`. De ahí salen gratis el teclado —flechas en el grupo
 * de radios, espacio en las casillas—, el anuncio del grupo y el envío en un
 * formulario. La ficha es solo pintura sobre un control que ya funcionaba.
 *
 * La marca de selección es un **cuadro con tilde** o un **punto**, según el
 * tipo, y no solo el borde de color: quien no distingue el acento del fondo
 * tiene que poder ver cuál está elegida.
 */
export function ChoiceGroup<V extends string>({
  opciones,
  etiquetaGrupo,
  seleccion,
  onCambiar,
  multiple = false,
  columnas = 1,
  className,
}: {
  opciones: readonly Opcion<V>[];
  etiquetaGrupo: string;
  /** Siempre una lista, con o sin `multiple`: así el consumidor no cambia de forma. */
  seleccion: readonly V[];
  onCambiar: (seleccion: V[]) => void;
  multiple?: boolean;
  columnas?: 1 | 2;
  className?: string;
}) {
  const nombre = useId();

  const alternar = (valor: V) => {
    if (!multiple) {
      onCambiar([valor]);
      return;
    }
    onCambiar(
      seleccion.includes(valor)
        ? seleccion.filter((actual) => actual !== valor)
        : [...seleccion, valor],
    );
  };

  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={etiquetaGrupo}
      className={cn('grid gap-2', columnas === 2 && 'sm:grid-cols-2', className)}
    >
      {opciones.map((opcion) => {
        const elegida = seleccion.includes(opcion.valor);

        return (
          <label
            key={opcion.valor}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors duration-150',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
              elegida
                ? 'border-primary bg-primary-container/40'
                : 'border-outline-variant bg-surface-container-lowest hover:border-outline',
            )}
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={nombre}
              value={opcion.valor}
              checked={elegida}
              onChange={() => alternar(opcion.valor)}
              className="sr-only"
            />

            {/* La marca. `rounded-xs` en la casilla y `rounded-full` en el
                radio: es lo que distingue «puedo elegir varias» de «solo una»
                antes de tocar nada. */}
            <span
              aria-hidden
              className={cn(
                'mt-px flex size-[18px] shrink-0 items-center justify-center border-2 transition-colors',
                multiple ? 'rounded-xs' : 'rounded-full',
                elegida
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline bg-surface-container-lowest',
              )}
            >
              {elegida &&
                (multiple ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                ))}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
                {opcion.icono}
                {opcion.etiqueta}
              </span>
              {opcion.detalle && (
                <span className="mt-0.5 block text-xs text-on-surface-variant">
                  {opcion.detalle}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
