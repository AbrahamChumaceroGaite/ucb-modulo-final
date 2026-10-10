'use client';

import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { CLASES_CALENDARIO } from './date-picker.data';
import { formatearFecha } from '@/shared/lib/format';
import { Popover } from '../overlays/popover';
import { Button } from '../actions/button';

/** Selector de una fecha. Devuelve `null` cuando se limpia. */
export function DatePicker({
  valor,
  onCambiar,
  marcador = 'Elegir fecha',
  maxima,
}: {
  valor: Date | null;
  onCambiar: (fecha: Date | null) => void;
  marcador?: string;
  maxima?: Date;
}) {
  return (
    <Popover
      alineacion="inicio"
      disparador={({ abierto, alternar }) => (
        <button
          type="button"
          onClick={alternar}
          aria-expanded={abierto}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm transition-colors',
            'bg-surface-container-lowest text-on-surface',
            abierto ? 'border-secondary' : 'border-outline-variant hover:border-outline',
          )}
        >
          <Calendar className="size-4 shrink-0 text-on-surface-variant" aria-hidden />
          <span className={cn(!valor && 'text-on-surface-variant/60')}>
            {valor ? formatearFecha(valor) : marcador}
          </span>
        </button>
      )}
    >
      {({ cerrar }) => (
        <div className="p-2">
          <DayPicker
            mode="single"
            locale={es}
            selected={valor ?? undefined}
            onSelect={(fecha) => {
              onCambiar(fecha ?? null);
              cerrar();
            }}
            disabled={maxima ? { after: maxima } : undefined}
            classNames={CLASES_CALENDARIO}
            className="relative"
          />
        </div>
      )}
    </Popover>
  );
}

/**
 * Selector de intervalo.
 *
 * **No aplica al vuelo.** Elegir un rango pasa por estados intermedios —al
 * marcar el primer día el segundo aún es `undefined`— y aplicar en cada paso
 * dispararía una consulta por medio intervalo. Se confirma con «Aplicar».
 */
export function DateRangePicker({
  valor,
  onCambiar,
  maxima,
  deshabilitado = false,
  motivo,
}: {
  valor: DateRange | undefined;
  onCambiar: (rango: DateRange | undefined) => void;
  maxima?: Date;
  /** Apagado. Se sigue viendo: la pantalla explica por qué al lado. */
  deshabilitado?: boolean;
  /** Lo que lee quien pase por encima. Obligatorio si está apagado. */
  motivo?: string;
}) {
  const [borrador, setBorrador] = useState<DateRange | undefined>(valor);

  const resumen = !valor?.from
    ? 'Cualquier fecha'
    : valor.to
      ? `${formatearFecha(valor.from)} — ${formatearFecha(valor.to)}`
      : `Desde ${formatearFecha(valor.from)}`;

  return (
    <Popover
      alineacion="fin"
      disparador={({ abierto, alternar }) => (
        <button
          type="button"
          disabled={deshabilitado}
          title={deshabilitado ? motivo : undefined}
          onClick={() => {
            setBorrador(valor);
            alternar();
          }}
          aria-expanded={abierto}
          className={cn(
            'flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            valor?.from
              ? 'border-secondary bg-secondary-container text-on-secondary-container'
              : 'border-outline-variant bg-surface-container text-on-surface-variant enabled:hover:border-outline',
          )}
        >
          <Calendar className="size-4 shrink-0" aria-hidden />
          <span className="whitespace-nowrap">{resumen}</span>
        </button>
      )}
    >
      {({ cerrar }) => (
        <div className="flex flex-col gap-2 p-2">
          <DayPicker
            mode="range"
            locale={es}
            selected={borrador}
            onSelect={setBorrador}
            disabled={maxima ? { after: maxima } : undefined}
            classNames={CLASES_CALENDARIO}
            className="relative"
          />

          <div className="flex items-center justify-end gap-2 border-t border-outline-variant pt-2">
            <Button
              tono="fantasma"
              medida="sm"
              onClick={() => {
                setBorrador(undefined);
                onCambiar(undefined);
                cerrar();
              }}
            >
              Limpiar
            </Button>
            <Button
              tono="primary"
              medida="sm"
              onClick={() => {
                onCambiar(borrador);
                cerrar();
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}
