'use client';

import { AtSign, FileText, IdCard, Phone, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tag } from '@/shared/ui/primitives';
import { nombreCompleto, type Persona } from '../../domain/persona.schema';

/**
 * La ficha que se abre al pulsar una persona.
 *
 * Va dentro del panel que **empuja**, no del que se superpone: quien mira una
 * ficha suele querer comparar con la siguiente, y con el panel lateral la
 * lista sigue ahí para recorrerla. En pantalla estrecha el panel se convierte
 * solo en la hoja que sube desde abajo.
 *
 * ## El informe
 *
 * Todavía no existe, y aquí se dice con esas palabras. No hay un botón
 * «Descargar informe» que no descargue nada: un botón que miente cuesta más
 * que una línea que avisa. Cuando el endpoint exista, esa nota se convierte en
 * el botón.
 */
export function PersonaDetalle({
  persona,
  dadaDeBaja,
  extras,
}: {
  persona: Persona;
  dadaDeBaja: boolean;
  /** Lo que solo tiene una de las dos colecciones: correo y rol de una cuenta. */
  extras?: readonly { etiqueta: string; valor: ReactNode }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-on-surface">{nombreCompleto(persona)}</h3>
        {dadaDeBaja && <Tag tono="neutral">Dada de baja</Tag>}
      </div>

      <dl className="flex flex-col divide-y divide-outline-variant/50">
        <Dato icono={<IdCard className="size-3.5" />} etiqueta="Carnet">
          {persona.carnet}
        </Dato>
        <Dato icono={<Phone className="size-3.5" />} etiqueta="Teléfono">
          {persona.telefono ?? '—'}
        </Dato>

        {extras?.map((extra) => (
          <Dato
            key={extra.etiqueta}
            icono={
              extra.etiqueta === 'Rol' ? (
                <ShieldCheck className="size-3.5" />
              ) : (
                <AtSign className="size-3.5" />
              )
            }
            etiqueta={extra.etiqueta}
          >
            {extra.valor}
          </Dato>
        ))}
      </dl>

      <p className="flex items-start gap-2 rounded-md border border-dashed border-outline-variant p-3 text-xs leading-5 text-on-surface-variant">
        <FileText className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
        El informe de actividad —pedidos atendidos, turnos y consumos— se está preparando. Cuando
        el backend lo sirva, se descarga desde aquí.
      </p>
    </div>
  );
}

/** Una línea de la ficha. Existe para que las cinco se pinten igual. */
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
