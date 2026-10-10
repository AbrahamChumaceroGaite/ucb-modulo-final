'use client';

import { createContext, useContext, useId, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Envoltura de un campo: etiqueta flotante, control, ayuda y error.
 *
 * El id lo genera este componente y lo reparte por contexto, de modo que la
 * etiqueta y el control quedan asociados sin que cada formulario invente un id
 * y lo repita en dos sitios. Un `<label>` sin `for` es un `<label>` que no
 * hace nada.
 *
 * ## Etiqueta flotante, y dónde vive la lógica
 *
 * La etiqueta descansa dentro del campo y sube a montarse sobre el borde en
 * cuanto hay foco o contenido. **Toda** esa lógica es CSS (`.campo-flotante`
 * en `globals.css`) y se apoya en `:has()`, así que el control no tiene que
 * colaborar: un `<input>`, un `<textarea>` o un `<select>` dentro del campo
 * funcionan sin saber que la etiqueta existe.
 *
 * La alternativa —que cada control pintara su propia etiqueta— habría
 * repetido el mismo bloque en tres archivos y habría dejado fuera a cualquier
 * control nuevo hasta que alguien se acordara de añadírselo.
 */
type ContextoCampo = {
  id: string;
  idDescripcion: string;
  invalido: boolean;
  requerido: boolean;
};

const CampoCtx = createContext<ContextoCampo | null>(null);

/** Lo consumen los controles para heredar id y estado de validación. */
export function useCampo(): ContextoCampo | null {
  return useContext(CampoCtx);
}

export function Field({
  etiqueta,
  ayuda,
  error,
  requerido = false,
  children,
  className,
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const idDescripcion = `${id}-desc`;
  const invalido = Boolean(error);

  return (
    <CampoCtx.Provider value={{ id, idDescripcion, invalido, requerido }}>
      <div className={cn('flex min-w-0 flex-col gap-1', className)}>
        <div className="campo-flotante">
          {children}

          {/* Después del control a propósito: el CSS lo busca como hermano
              con `:has()`, y así el control conserva el primer plano. */}
          <label htmlFor={id}>
            {etiqueta}
            {requerido && (
              <span className="ml-0.5 text-error" aria-hidden>
                *
              </span>
            )}
          </label>
        </div>

        {/* El error sustituye a la ayuda: mostrar los dos a la vez compite por
            la atención justo cuando hace falta una sola instrucción. */}
        {(error || ayuda) && (
          <p
            id={idDescripcion}
            className={cn('px-1 text-xs', error ? 'text-error' : 'text-on-surface-variant')}
            role={error ? 'alert' : undefined}
          >
            {error ?? ayuda}
          </p>
        )}
      </div>
    </CampoCtx.Provider>
  );
}
