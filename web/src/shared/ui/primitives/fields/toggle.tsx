'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/**
 * Casilla de verificación.
 *
 * El `<input>` real existe y recibe el foco; lo que se ve es un cuadro pintado
 * encima. Así el teclado, los formularios nativos y React Hook Form funcionan
 * sin adaptadores, y el anillo de foco aparece donde debe.
 *
 * Controlada por `checked` + `onChange`. Sin estado interno duplicado.
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  etiqueta?: string;
  /** Para el «seleccionar todo» cuando solo hay algunas filas marcadas. */
  indeterminado?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, etiqueta, indeterminado = false, checked, disabled, ...props },
  ref,
) {
  const marcado = Boolean(checked);

  return (
    <label
      className={cn(
        'group inline-flex cursor-pointer items-center gap-2 text-sm text-on-surface',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="relative flex size-[18px] shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          checked={marcado}
          disabled={disabled}
          aria-checked={indeterminado ? 'mixed' : marcado}
          className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          className={cn(
            'pointer-events-none flex size-[18px] items-center justify-center rounded-xs border-2 transition-colors duration-150',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
            marcado || indeterminado
              ? 'border-primary bg-primary text-on-primary'
              : 'border-outline bg-surface-container-lowest',
          )}
          aria-hidden
        >
          {indeterminado ? (
            <Minus className="size-3" strokeWidth={3} />
          ) : (
            marcado && <Check className="size-3" strokeWidth={3} />
          )}
        </span>
      </span>
      {etiqueta && <span className="select-none">{etiqueta}</span>}
    </label>
  );
});

/**
 * Interruptor. Se usa cuando el cambio surte efecto de inmediato; para algo que
 * se confirma con un botón «Guardar», va una casilla.
 */
export const Switch = forwardRef<HTMLInputElement, Omit<CheckboxProps, 'indeterminado'>>(
  function Switch({ className, etiqueta, checked, disabled, ...props }, ref) {
    const activo = Boolean(checked);

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2.5 text-sm text-on-surface',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span className="relative inline-flex">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            checked={activo}
            disabled={disabled}
            className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <span
            className={cn(
              'pointer-events-none flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-200',
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
              activo ? 'bg-primary' : 'bg-outline-variant',
            )}
            aria-hidden
          >
            <span
              className={cn(
                'size-4 rounded-full bg-surface-container-lowest transition-transform duration-200',
                activo && 'translate-x-4',
              )}
            />
          </span>
        </span>
        {etiqueta && <span className="select-none">{etiqueta}</span>}
      </label>
    );
  },
);
