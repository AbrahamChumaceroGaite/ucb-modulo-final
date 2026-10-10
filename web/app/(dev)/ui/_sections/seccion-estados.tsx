'use client';

import { useState } from 'react';
import { Coffee, PackageSearch, Plus, WifiOff } from 'lucide-react';
import {
  AppliedChip,
  Button,
  Dots,
  ProgressBar,
  Skeleton,
  SkeletonCard,
  SkeletonForm,
  SkeletonText,
  StatusDot,
  Tag,
} from '@/shared/ui/primitives';
import { EmptyState } from '@/shared/ui/patterns';
import { Muestra, Seccion } from '../_components/showcase';

/**
 * Los estados que una pantalla tiene además del feliz.
 *
 * Están en el catálogo a propósito: son los que se olvidan. Una pantalla que
 * solo se diseñó llena enseña un hueco en blanco el día que la API falla, y
 * quien la usa no sabe si no hay datos o si algo se rompió.
 */
export function SeccionEstados() {
  const [chips, setChips] = useState({ categoria: 'Café', estado: 'Bajo mínimos' });

  return (
    <Seccion
      id="estados"
      titulo="Estados"
      descripcion="Cargando, vacío y error. Sin ruletas: el skeleton reserva el sitio exacto del contenido real."
    >
      <Muestra titulo="Cargando" nota="Una veta de luz lo recorre. El parpadeo cansa en una pantalla que se mira todo el día." className="block">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="label-caps mb-2 text-on-surface-variant">Tarjeta</p>
            <SkeletonCard />
          </div>

          <div>
            <p className="label-caps mb-2 text-on-surface-variant">Texto</p>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
              <Skeleton className="mb-3 h-4 w-1/2" />
              <SkeletonText lineas={4} />
            </div>
          </div>

          <div>
            <p className="label-caps mb-2 text-on-surface-variant">Formulario</p>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
              <SkeletonForm campos={3} />
            </div>
          </div>
        </div>
      </Muestra>

      <Muestra titulo="Trabajando" nota="Puntos, nunca un círculo girando: no finge conocer el progreso.">
        <span className="inline-flex items-center gap-2 text-sm text-on-surface">
          Guardando <Dots />
        </span>
        <Button tono="primary" cargando>
          Cobrando
        </Button>
      </Muestra>

      <Muestra titulo="Sin nada que mostrar" nota="Tres situaciones distintas que no se pueden confundir." className="block">
        <div className="grid gap-3 lg:grid-cols-3">
          <EmptyState
            icono={<Coffee className="size-5" />}
            titulo="La despensa está vacía"
            mensaje="Añade el primer insumo para empezar a llevar la cuenta."
            accion={
              <Button tono="primary" medida="sm" icono={<Plus className="size-3.5" />}>
                Añadir insumo
              </Button>
            }
          />
          <EmptyState
            icono={<PackageSearch className="size-5" />}
            titulo="Nada coincide con «matcha»"
            mensaje="Prueba con otro nombre o limpia el filtro."
            accion={
              <Button tono="contorno" medida="sm">
                Limpiar búsqueda
              </Button>
            }
          />
          <EmptyState
            icono={<WifiOff className="size-5 text-error" />}
            titulo="No pudimos traer los insumos"
            mensaje="El servidor no respondió. Suele ser cosa de un momento."
            accion={
              <Button tono="contorno" medida="sm">
                Reintentar
              </Button>
            }
          />
        </div>
      </Muestra>

      <Muestra titulo="Etiquetas" nota="Siempre con texto: el color no puede ser la única señal.">
        <Tag tono="neutral">Sin categoría</Tag>
        <Tag tono="primary">Café</Tag>
        <Tag tono="secondary">Destacado</Tag>
        <Tag tono="success">Bien surtido</Tag>
        <Tag tono="warning">Queda poco</Tag>
        <Tag tono="danger">Hay que reponer</Tag>
        <Tag tono="success" solido>
          Sólida
        </Tag>
      </Muestra>

      <Muestra titulo="Puntos de estado" nota="Para tablas densas, donde una etiqueta entera roba ancho a los datos.">
        <StatusDot tono="success">Bien surtido</StatusDot>
        <StatusDot tono="warning">Queda poco</StatusDot>
        <StatusDot tono="danger">Hay que reponer</StatusDot>
      </Muestra>

      <Muestra titulo="Filtros aplicados" nota="Un listado filtrado sin señal visible se lee como un listado vacío." className="block">
        <div className="flex flex-wrap items-center gap-2">
          {chips.categoria && (
            <AppliedChip
              etiqueta="Categoría"
              valor={chips.categoria}
              onQuitar={() => setChips((actual) => ({ ...actual, categoria: '' }))}
            />
          )}
          {chips.estado && (
            <AppliedChip
              etiqueta="Estado"
              valor={chips.estado}
              onQuitar={() => setChips((actual) => ({ ...actual, estado: '' }))}
            />
          )}
          {!chips.categoria && !chips.estado && (
            <button
              type="button"
              className="text-xs text-secondary underline"
              onClick={() => setChips({ categoria: 'Café', estado: 'Bajo mínimos' })}
            >
              Volver a poner los filtros
            </button>
          )}
        </div>
      </Muestra>

      <Muestra titulo="Niveles" nota="El umbral lo decide el negocio; la barra solo lo pinta." className="block">
        <div className="flex max-w-md flex-col gap-3">
          {[
            { etiqueta: 'House Espresso', valor: 2.5, maximo: 10, tono: 'danger' as const },
            { etiqueta: 'Leche de avena', valor: 6, maximo: 12, tono: 'warning' as const },
            { etiqueta: 'Leche entera', valor: 18, maximo: 20, tono: 'success' as const },
          ].map((nivel) => (
            <div key={nivel.etiqueta}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-on-surface">{nivel.etiqueta}</span>
                <span data-tabular className="text-on-surface-variant">
                  {nivel.valor} / {nivel.maximo}
                </span>
              </div>
              <ProgressBar
                valor={nivel.valor}
                maximo={nivel.maximo}
                tono={nivel.tono}
                etiqueta={nivel.etiqueta}
              />
            </div>
          ))}
        </div>
      </Muestra>
    </Seccion>
  );
}
