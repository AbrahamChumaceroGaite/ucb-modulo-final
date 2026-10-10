'use client';

import { type ReactNode } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '../../primitives/actions/button';
import { IconAction } from '../../primitives/actions/icon-action';

/**
 * Una lista de campos que se añaden y se quitan: ingredientes, pasos, lo que
 * venga.
 *
 * ## Por qué existe, y por qué en `shared`
 *
 * Es la primera pantalla que necesita repetir un grupo de campos, y a la vez
 * lo necesita **dos veces** —ingredientes y pasos—. Escribirlo dentro del
 * formulario de recetas habría sido escribirlo dos veces el mismo día.
 *
 * Aquí no hay nada de recetas: recibe las filas ya pintadas y emite «añade» y
 * «quita». Quien sabe qué es un ingrediente es el formulario.
 *
 * ## El número de orden se pinta, no se teclea
 *
 * Un paso tiene un orden, y ese orden **es su posición en la lista**. Pintarlo
 * como un campo editable invita a dos pasos con el número 3 y obliga a
 * reconciliar. El backend hace lo mismo: `PasoRecetaRequest` solo acepta la
 * descripción, y el orden sale de la posición.
 *
 * Por eso `numerada` pinta el índice a la izquierda, y por eso el tirador es
 * decorativo por ahora: ordenar arrastrando es otra funcionalidad, y un
 * control que promete arrastre sin tenerlo es peor que no ponerlo (regla
 * 8.14). Se reordena quitando y volviendo a añadir.
 *
 * ## El mínimo se defiende aquí y en el esquema
 *
 * `minimo` esconde el botón de quitar cuando quedan los últimos elementos, para
 * no dejar la lista vacía de un clic. Pero la regla de verdad está en Zod —
 * `.min(1, 'Una receta necesita al menos un ingrediente')`—, porque una
 * restricción que solo vive en el dibujo se salta desde la consola.
 */
export function FieldList({
  titulo,
  ayuda,
  filas,
  onAnadir,
  onQuitar,
  textoAnadir,
  etiquetaQuitar,
  error,
  minimo = 1,
  numerada = false,
  className,
}: {
  titulo: string;
  ayuda?: string;
  /** Cada fila ya pintada por quien conoce el dominio. */
  filas: readonly ReactNode[];
  onAnadir: () => void;
  onQuitar: (indice: number) => void;
  textoAnadir: string;
  /** Qué se quita, para el lector de pantalla: «Quitar el ingrediente 2». */
  etiquetaQuitar: (indice: number) => string;
  /** El error de la lista entera, no el de una fila. */
  error?: string;
  minimo?: number;
  numerada?: boolean;
  className?: string;
}) {
  const sePuedeQuitar = filas.length > minimo;

  return (
    <section className={cn('flex flex-col gap-2', className)} aria-label={titulo}>
      <header className="flex items-baseline justify-between gap-2">
        <h4 className="label-caps text-on-surface-variant">{titulo}</h4>
        {ayuda && <p className="text-xs text-on-surface-variant">{ayuda}</p>}
      </header>

      <ul className="flex flex-col gap-2">
        {filas.map((fila, indice) => (
          // El índice como clave es correcto **aquí**: la identidad de una fila
          // de esta lista ES su posición, y el contenido lo mantiene React Hook
          // Form por su propio id, no este nodo.
          <li key={indice} className="flex items-start gap-2 rounded-md">
            {numerada ? (
              <span
                aria-hidden
                className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-semibold tabular-nums text-on-surface-variant"
              >
                {indice + 1}
              </span>
            ) : (
              <GripVertical
                aria-hidden
                className="mt-2.5 size-4 shrink-0 text-on-surface-variant/40"
              />
            )}

            <div className="min-w-0 flex-1">{fila}</div>

            <span className="mt-1 shrink-0">
              <IconAction
                accion="eliminar"
                etiqueta={etiquetaQuitar(indice)}
                icono={<Trash2 className="size-4" />}
                onClick={() => onQuitar(indice)}
                disabled={!sePuedeQuitar}
              />
            </span>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}

      <div>
        <Button
          tono="contorno"
          type="button"
          icono={<Plus className="size-4" />}
          onClick={onAnadir}
        >
          {textoAnadir}
        </Button>
      </div>
    </section>
  );
}
