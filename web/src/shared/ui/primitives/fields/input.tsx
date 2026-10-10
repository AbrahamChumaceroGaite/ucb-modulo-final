'use client';

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useCampo } from './field';

/**
 * Entrada de texto.
 *
 * Controlada siempre: `value` + `onChange`. No guarda una copia de su prop en
 * estado interno — auditamos una librería cuyo `Checkbox` lo hace y por eso no
 * funciona con React Hook Form.
 *
 * El tipo `password` añade el botón de mostrar/ocultar, **alcanzable con el
 * teclado**: en esa misma librería lleva `tabIndex={-1}` y queda fuera del
 * recorrido.
 *
 * ## El marcador nunca falta
 *
 * Aunque no se pase ninguno, el atributo se pone con un espacio. No es un
 * apaño: la etiqueta flotante decide si el campo está vacío con
 * `:placeholder-shown`, y un `<input>` sin atributo `placeholder` **nunca**
 * casa con ese selector, así que la etiqueta se quedaría flotando sobre un
 * campo vacío. El marcador de verdad, si lo hay, permanece oculto hasta que se
 * enfoca el campo, para no competir con la etiqueta.
 */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  iconoInicio?: ReactNode;
  iconoFinal?: ReactNode;
  medida?: 'sm' | 'md';
  /**
   * Solo dígitos: descarta cualquier otra tecla al escribir y al pegar.
   *
   * No es `type="number"`: ese tipo trae ruedecilla, acepta `e`, `+` y `-`
   * —son números válidos— y en varios navegadores deja el campo vacío en vez
   * de decir qué pasa. Un carnet o un teléfono son **cadenas de dígitos**, no
   * cantidades: no se suman, no se ordenan y pueden empezar por cero. Lo
   * correcto es texto filtrado.
   */
  soloDigitos?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    iconoInicio,
    iconoFinal,
    medida = 'sm',
    type = 'text',
    placeholder,
    soloDigitos = false,
    onChange,
    ...props
  },
  ref,
) {
  const campo = useCampo();
  const [verClave, setVerClave] = useState(false);
  const esClave = type === 'password';
  const tipoReal = esClave && verClave ? 'text' : type;

  return (
    <div className="relative flex w-full items-center">
      {iconoInicio && (
        <span
          className={cn(
            'pointer-events-none absolute z-10 flex text-on-surface-variant',
            medida === 'sm' ? 'left-2.5' : 'left-3',
          )}
          aria-hidden
        >
          {iconoInicio}
        </span>
      )}

      <input
        ref={ref}
        id={campo?.id}
        type={tipoReal}
        placeholder={placeholder ?? ' '}
        // Lo lee el CSS de la etiqueta flotante para arrancar después del
        // icono en vez de encima de él.
        data-icono={iconoInicio ? medida : undefined}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={campo?.idDescripcion}
        aria-required={campo?.requerido || undefined}
        inputMode={soloDigitos ? 'numeric' : props.inputMode}
        onChange={(evento) => {
          if (soloDigitos) {
            // Se limpia el valor antes de avisar: así lo que ve el campo y lo
            // que recibe el formulario son lo mismo. Filtrar en `onKeyDown`
            // dejaría pasar el pegado y el dictado por voz.
            evento.target.value = evento.target.value.replace(/\D/g, '');
          }
          onChange?.(evento);
        }}
        className={cn(
          'w-full rounded-md border bg-surface-container-lowest text-on-surface',
          'transition-colors duration-150 outline-none',
          'placeholder:text-on-surface-variant/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // El alto deja sitio a la etiqueta en la franja de arriba, y el
          // texto se apoya abajo: por eso `pt` es mayor que `pb`.
          medida === 'sm' ? 'h-9 px-2.5 pt-4 pb-1 text-xs' : 'h-11 px-3 pt-5 pb-1.5 text-sm',
          iconoInicio && (medida === 'sm' ? 'pl-8' : 'pl-10'),
          (iconoFinal || esClave) && (medida === 'sm' ? 'pr-9' : 'pr-10'),
          campo?.invalido
            ? 'border-error focus:border-error'
            : 'border-outline-variant hover:border-outline focus:border-secondary',
          className,
        )}
        {...props}
      />

      {esClave ? (
        <button
          type="button"
          onClick={() => setVerClave((v) => !v)}
          className="absolute right-1.5 z-10 flex size-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {verClave ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      ) : (
        iconoFinal && (
          <span className="absolute right-3 z-10 flex text-on-surface-variant" aria-hidden>
            {iconoFinal}
          </span>
        )
      )}
    </div>
  );
});
