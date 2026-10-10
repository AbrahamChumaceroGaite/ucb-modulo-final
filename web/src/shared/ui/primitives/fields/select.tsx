'use client';

import { forwardRef, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useCampo } from './field';

type OpcionSelect = { valor: string; etiqueta: string };

/**
 * Desplegable sobre `<select>` nativo.
 *
 * Nativo a propósito: en móvil abre el selector del sistema, que es el que la
 * persona ya sabe usar, y llega con teclado y lector de pantalla resueltos.
 * Un desplegable reimplementado tarda semanas en igualar eso.
 *
 * Su etiqueta flotante está **siempre arriba**: un `<select>` nunca está
 * vacío, siempre enseña algo —su marcador o la opción elegida—, así que dejar
 * la etiqueta descansando dentro la pondría encima de ese texto.
 */
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  opciones: readonly OpcionSelect[];
  marcador?: string;
  medida?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, opciones, marcador = 'Selecciona…', medida = 'sm', ...props },
  ref,
) {
  const campo = useCampo();

  return (
    <div className="relative flex w-full items-center">
      <select
        ref={ref}
        id={campo?.id}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={campo?.idDescripcion}
        aria-required={campo?.requerido || undefined}
        className={cn(
          'w-full appearance-none rounded-md border bg-surface-container-lowest text-on-surface',
          'transition-colors duration-150 outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          medida === 'sm' ? 'h-9 pt-4 pb-1 pl-2.5 pr-8 text-xs' : 'h-11 pt-5 pb-1.5 pl-3 pr-10 text-sm',
          campo?.invalido
            ? 'border-error'
            : 'border-outline-variant hover:border-outline focus:border-secondary',
          className,
        )}
        {...props}
      >
        <option value="">{marcador}</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-3 size-4 text-on-surface-variant"
        aria-hidden
      />
    </div>
  );
});

/**
 * Área de texto. Crece con `rows`; no se redimensiona en horizontal.
 *
 * Lleva marcador por omisión por la misma razón que `Input`: sin el atributo,
 * `:placeholder-shown` no casa nunca y la etiqueta flotaría sobre un campo
 * vacío.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, placeholder, ...props }, ref) {
    const campo = useCampo();

    return (
      <textarea
        ref={ref}
        id={campo?.id}
        rows={rows}
        placeholder={placeholder ?? ' '}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={campo?.idDescripcion}
        aria-required={campo?.requerido || undefined}
        className={cn(
          // `pt-6` reserva la banda donde descansa la etiqueta antes de flotar.
          'w-full resize-y rounded-md border bg-surface-container-lowest px-2.5 pt-6 pb-2 text-xs text-on-surface',
          'transition-colors duration-150 outline-none',
          'placeholder:text-on-surface-variant/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          campo?.invalido
            ? 'border-error'
            : 'border-outline-variant hover:border-outline focus:border-secondary',
          className,
        )}
        {...props}
      />
    );
  },
);
