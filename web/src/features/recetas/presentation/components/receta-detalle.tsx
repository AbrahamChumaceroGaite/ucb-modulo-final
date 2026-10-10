'use client';

import { AlertTriangle, CookingPot } from 'lucide-react';
import { Tag } from '@/shared/ui/primitives';
import {
  ingredientesQueFaltan,
  tandasPosibles,
  type Receta,
} from '../../domain/receta.schema';
import { conUnidad, type ReferenciaDeProducto } from '../../domain/referencia-producto.schema';

/**
 * La ficha que se abre al pulsar una receta.
 *
 * Va en el panel que **empuja**, igual que las otras dos: quien mira una ficha
 * suele querer comparar con la siguiente, y así la lista sigue ahí.
 *
 * Enseña lo que la tarjeta no cabe: los ingredientes con su cantidad y su
 * unidad, y los pasos en orden. Es la única de las tres fichas con contenido
 * largo, así que el panel es el sitio correcto y no un tooltip.
 *
 * ## Lo que falta se dice arriba, no al final
 *
 * Si algún ingrediente no llega para una tanda, se avisa antes de la lista.
 * Quien abre una receta en plena barra necesita saber que no puede hacerla
 * **antes** de leerse los pasos.
 */
export function RecetaDetalle({
  receta,
  productos,
}: {
  receta: Receta;
  /** Por id, ya resueltos. La ficha no sale a buscar nada. */
  productos: ReadonlyMap<string, ReferenciaDeProducto>;
}) {
  const obtenido = productos.get(receta.idProductoObtenido);
  const stock = new Map([...productos].map(([id, producto]) => [id, producto.stock]));

  const tandas = tandasPosibles(receta, stock);
  const faltan = ingredientesQueFaltan(receta, stock);

  const ingredientes = receta.ingredientes.filter((uno) => !uno.borrado);
  const pasos = [...receta.pasos]
    .filter((paso) => !paso.borrado)
    .sort((uno, otro) => uno.pasos - otro.pasos);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-on-surface">{receta.titulo}</h3>
        {receta.borrado && <Tag tono="neutral">Dada de baja</Tag>}
      </div>

      <p className="flex items-center gap-2 text-xs text-on-surface-variant">
        <CookingPot className="size-3.5" aria-hidden />
        Una tanda rinde {conUnidad(receta.cantidad, obtenido)} de{' '}
        {obtenido?.nombre ?? receta.idProductoObtenido}
      </p>

      {faltan.length > 0 && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md bg-error/10 p-2 text-xs text-error"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            No alcanza para una tanda:{' '}
            {faltan
              .map((uno) => productos.get(uno.idProducto)?.nombre ?? uno.idProducto)
              .join(', ')}
          </span>
        </p>
      )}

      {tandas !== null && faltan.length === 0 && (
        <p className="text-xs text-on-surface-variant">
          Con lo que hay en la despensa salen {tandas} tanda{tandas === 1 ? '' : 's'}.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h4 className="label-caps text-on-surface-variant">Lleva</h4>
        <ul className="flex flex-col gap-1">
          {ingredientes.map((ingrediente) => {
            const producto = productos.get(ingrediente.idProducto);

            return (
              <li
                key={ingrediente.id}
                className="flex items-baseline justify-between gap-3 border-b border-outline-variant/40 pb-1 text-sm last:border-0"
              >
                {/* Sin el nombre resuelto se enseña el id: es feo y es cierto.
                    Inventar un «Producto desconocido» escondería el fallo. */}
                <span className="text-on-surface">
                  {producto?.nombre ?? ingrediente.idProducto}
                </span>
                <span className="shrink-0 tabular-nums text-on-surface-variant">
                  {conUnidad(ingrediente.cantidad, producto)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="label-caps text-on-surface-variant">Cómo se hace</h4>
        {/* `<ol>` y no `<ul>`: el orden es el significado, y un lector de
            pantalla tiene que anunciarlo. */}
        <ol className="flex flex-col gap-2">
          {pasos.map((paso) => (
            <li key={paso.id} className="flex gap-2 text-sm text-on-surface">
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-[0.625rem] font-semibold tabular-nums text-on-surface-variant"
              >
                {paso.pasos}
              </span>
              <span className="min-w-0">{paso.descripcion}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
