'use client';

import { Boxes, Coins, Layers, Package, Ruler } from 'lucide-react';
import type { ReactNode } from 'react';
import { ProgressBar, Tag } from '@/shared/ui/primitives';
import { TONO_POR_NIVEL } from '@/shared/config/levels';
import { formatearCantidad, formatearMoneda } from '@/shared/lib/format';
import { nivelDeStock, TEXTO_NIVEL, type Producto } from '../../domain/producto.schema';

/**
 * La ficha que se abre al pulsar un producto.
 *
 * Va en el panel que **empuja**, igual que la de una persona: quien mira una
 * ficha suele querer comparar con la siguiente, y así la lista sigue ahí.
 *
 * Enseña lo que la tarjeta no cabe: unidad completa, categoría, y de qué
 * producto es presentación cuando lo es.
 */
export function ProductoDetalle({
  producto,
  nombreDelPadre,
}: {
  producto: Producto;
  /** El padre ya resuelto. La ficha no sale a buscarlo: se lo dan hecho. */
  nombreDelPadre?: string;
}) {
  const nivel = nivelDeStock(producto);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-on-surface">{producto.nombre}</h3>
        {producto.borrado && <Tag tono="neutral">Dado de baja</Tag>}
      </div>

      {producto.stockMinimo > 0 && (
        <div>
          <ProgressBar
            valor={producto.stock}
            maximo={producto.stockMinimo}
            tono={TONO_POR_NIVEL[nivel]}
            etiqueta={`Existencias de ${producto.nombre}`}
          />
          <p className="mt-2 text-xs text-on-surface-variant">
            {TEXTO_NIVEL[nivel]}: quedan{' '}
            {formatearCantidad(producto.stock, producto.unidadActual?.abreviatura ?? '')} de un
            mínimo de{' '}
            {formatearCantidad(producto.stockMinimo, producto.unidadActual?.abreviatura ?? '')}.
          </p>
        </div>
      )}

      <dl className="flex flex-col divide-y divide-outline-variant/50">
        <Dato icono={<Coins className="size-3.5" />} etiqueta="Precio">
          {formatearMoneda(producto.precio)}
        </Dato>
        <Dato icono={<Ruler className="size-3.5" />} etiqueta="Unidad">
          {producto.unidadActual
            ? `${producto.unidadActual.unidad} (${producto.unidadActual.abreviatura})`
            : '—'}
        </Dato>
        <Dato icono={<Boxes className="size-3.5" />} etiqueta="Categoría">
          {producto.categoria?.nombre ?? '—'}
        </Dato>
        <Dato icono={<Package className="size-3.5" />} etiqueta="En la carta">
          <Tag tono={producto.vendible ? 'success' : 'neutral'}>
            {producto.vendible ? 'Se vende' : 'Solo despensa'}
          </Tag>
        </Dato>
        {producto.idProductoPadre && (
          <Dato icono={<Layers className="size-3.5" />} etiqueta="Presentación de">
            {nombreDelPadre ?? producto.idProductoPadre}
          </Dato>
        )}
      </dl>
    </div>
  );
}

/** Una línea de la ficha. Existe para que todas se pinten igual. */
function Dato({
  icono,
  etiqueta,
  children,
}: {
  icono: ReactNode;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="flex shrink-0 items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="text-secondary" aria-hidden>
          {icono}
        </span>
        {etiqueta}
      </dt>
      <dd className="min-w-0 truncate text-right text-xs font-medium text-on-surface" data-tabular>
        {children}
      </dd>
    </div>
  );
}
