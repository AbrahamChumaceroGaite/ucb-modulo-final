'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';
import { Dots } from '../feedback/dots';

/**
 * Botón del sistema.
 *
 * Es el **único** botón. No existe una clase `.kh-button` en `globals.css` que
 * permita esquivarlo: auditamos un proyecto con un componente de botón y 99
 * usos de su clase cruda frente a 19 del componente.
 *
 * Sin tamaño `lg`: la escala llega hasta `md` por las reglas de diseño, y el
 * **predeterminado es `sm`**. Un panel de trabajo cabe más veces en la pantalla
 * con controles pequeños, y `md` queda para lo que de verdad manda en su zona
 * —el botón de enviar de un formulario, la acción única de una pantalla—.
 *
 * El radio va un paso por encima del que le tocaría por tamaño: `md` en los
 * pequeños, `xl` en los medianos y círculo completo cuando solo hay icono.
 */
const botonVariantes = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap',
    'transition-[background-color,color,border-color,transform] duration-150',
    'disabled:opacity-50 disabled:pointer-events-none',
    'active:translate-y-px',
  ].join(' '),
  {
    variants: {
      tono: {
        primary: 'bg-primary text-on-primary hover:bg-primary/90',
        secondary: 'bg-secondary text-on-secondary hover:bg-secondary/90',
        neutral:
          'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant',
        danger: 'bg-error text-on-error hover:bg-error/90',
        contorno:
          'bg-transparent text-on-surface border border-outline-variant hover:bg-surface-container-high hover:border-outline',
        fantasma: 'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
      },
      medida: {
        sm: 'h-8 px-3.5 text-xs rounded-md',
        md: 'h-10 px-5 text-sm rounded-xl',
      },
      soloIcono: {
        true: 'px-0 aspect-square rounded-full',
        false: '',
      },
      bloque: { true: 'w-full', false: '' },
    },
    defaultVariants: { tono: 'neutral', medida: 'sm', soloIcono: false, bloque: false },
  },
);

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof botonVariantes> {
  icono?: ReactNode;
  /** A la derecha del texto. Para chevrons y contadores. */
  iconoFinal?: ReactNode;
  cargando?: boolean;
  /**
   * Qué está haciendo, para quien usa lector de pantalla.
   *
   * Era siempre «Guardando», que es lo que hace la mayoría de los botones que
   * esperan — pero no todos: el de descargar un reporte está preparándolo, no
   * guardando nada. Un `aria-label` que miente es peor que uno genérico.
   */
  etiquetaCargando?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, tono, medida, soloIcono, bloque, icono, iconoFinal, cargando = false, etiquetaCargando, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={cn(botonVariantes({ tono, medida, soloIcono, bloque }), className)}
      {...props}
    >
      {cargando ? (
        // El contenido no se desmonta, se sustituye: el ancho del botón no
        // salta mientras se guarda.
        <Dots label={etiquetaCargando ?? 'Guardando'} />
      ) : (
        <>
          {icono}
          {!soloIcono && children}
          {!soloIcono && iconoFinal}
        </>
      )}
    </button>
  );
});
