'use client';

import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';
import { Button } from '../../primitives/actions/button';
import { Stepper } from '../../primitives/navigation/stepper';
import { FormActions } from './form-layout';

export type PasoFormulario<T extends FieldValues> = {
  clave: string;
  titulo: string;
  /**
   * Los campos que este paso valida antes de dejar pasar. Es lo único que el
   * asistente necesita saber del esquema: el resto lo resuelve el resolver.
   */
  campos: readonly Path<T>[];
  contenido: ReactNode;
};

/**
 * Formulario por pasos, con validación en cada uno y revisión al final.
 *
 * ## Quién manda sobre qué
 *
 * El `useForm` lo crea **quien lo usa**: así el esquema, los valores iniciales
 * y el envío siguen siendo suyos, y este componente no se convierte en un
 * motor de formularios propio —que es exactamente lo que prohíbe la regla
 * 10.1—. Aquí solo vive lo que es del asistente: en qué paso estamos, si se
 * puede pasar al siguiente y cómo se pinta la revisión.
 *
 * ## No se avanza sin validar
 *
 * Al pulsar «Siguiente» se ejecuta `trigger()` **solo sobre los campos de ese
 * paso**. Si alguno falla, el paso no cambia y los errores aparecen donde
 * están los campos.
 *
 * Validar el formulario entero en cada paso sería peor: marcaría en rojo
 * campos de pasos que todavía no se han visto. Auditamos un asistente que
 * hacía lo contrario —no validaba nada hasta el final— y se llegaba al resumen
 * con campos vacíos que obligaban a recorrer los pasos hacia atrás buscándolos.
 *
 * ## Este formulario no se envía solo. Nunca.
 *
 * `onSubmit` **siempre** hace `preventDefault`, y guardar es una llamada
 * explícita desde el botón de confirmar. Parece exagerado y no lo es: el envío
 * automático del navegador provocó aquí dos defectos seguidos.
 *
 * 1. **La submit implícita.** Un formulario sin botón de envío a la vista se
 *    envía igual al pulsar Enter en un campo. Al editar, donde todos los
 *    valores ya son válidos, eso guardaba desde el paso 1.
 * 2. **El botón que cambia de tipo bajo el dedo.** «Siguiente» y «Guardar»
 *    ocupaban la misma posición del árbol, así que React reutilizaba el mismo
 *    `<button>` del DOM y solo le cambiaba el `type`. El navegador evalúa la
 *    *activation behavior* **después** de los manejadores: para cuando le
 *    tocaba, el botón ya era `submit`, y el clic que llevaba a la revisión
 *    guardaba de paso. Se cerraba el diálogo sin que nadie confirmara nada.
 *
 * Contra lo segundo hay además un `key` distinto en cada botón, para que sean
 * dos nodos y no uno que muda. Las dos defensas están porque la primera sola
 * no bastó, y porque **ninguna de las dos la cazó una prueba en jsdom**: allí
 * la activación no se comporta como en un navegador de verdad. Se vio
 * pulsando.
 */
export function FormWizard<T extends FieldValues>({
  form,
  pasos,
  resumen,
  onEnviar,
  onCancelar,
  enviando = false,
  textoEnviar = 'Guardar',
  className,
}: {
  form: UseFormReturn<T>;
  pasos: readonly PasoFormulario<T>[];
  /** La revisión final. Recibe los valores tal como están en ese momento. */
  resumen: (valores: T) => ReactNode;
  onEnviar: (valores: T) => void;
  onCancelar?: () => void;
  enviando?: boolean;
  textoEnviar?: string;
  className?: string;
}) {
  const [indice, setIndice] = useState(0);

  const pasosVisibles = [
    ...pasos.map((paso) => ({ clave: paso.clave, titulo: paso.titulo })),
    { clave: 'revision', titulo: 'Revisión' },
  ];
  const enRevision = indice === pasos.length;
  const pasoActual = pasos[indice];

  const avanzar = async () => {
    if (!pasoActual) return;
    // Solo los campos de este paso: el resto todavía no se ha visto y
    // marcarlos en rojo sería acusar de un error que nadie ha cometido.
    const valido = await form.trigger(pasoActual.campos as Path<T>[]);
    if (valido) setIndice((actual) => actual + 1);
  };

  return (
    <form
      // Nunca se envía por su cuenta: ni con Enter, ni por la activación de un
      // botón. Guardar es siempre una llamada explícita desde el pie.
      onSubmit={(evento) => evento.preventDefault()}
      noValidate
      className={cn('flex flex-col gap-5', className)}
    >
      {/* Mientras se guarda no se navega: cambiar de paso a mitad de una
          petición deja la pantalla diciendo una cosa y el servidor otra. */}
      <Stepper
        pasos={pasosVisibles}
        actual={indice}
        {...(enviando ? {} : { onIrA: setIndice })}
      />

      {/*
        Los pasos que no tocan se desmontan: mantenerlos ocultos deja sus campos
        en el DOM y el tabulador entra en ellos. React Hook Form conserva los
        valores igual, porque el estado vive en el formulario y no en los campos.

        El `key` con la clave del paso **no es decorativo**. Sin él, los campos
        de dos pasos distintos caen en la misma posición del árbol y React
        reutiliza el mismo `<input>` del DOM: al volver atrás, el campo de
        «Nombre» aparecía con el valor que había tecleado en «Precio». Lo cazó
        la prueba «se puede volver a un paso ya completado», no una revisión.
      */}
      <div key={enRevision ? 'revision' : pasoActual?.clave}>
        {enRevision ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-on-surface-variant">
              Esto es lo que se va a guardar. Pulsa cualquier paso de arriba para
              corregir algo antes de confirmar.
            </p>
            {resumen(form.getValues())}
          </div>
        ) : (
          pasoActual?.contenido
        )}
      </div>

      <FormActions>
        {indice > 0 && (
          <Button
            tono="fantasma"
            icono={<ArrowLeft className="size-4" />}
            onClick={() => setIndice((actual) => actual - 1)}
            disabled={enviando}
          >
            Atrás
          </Button>
        )}

        {onCancelar && indice === 0 && (
          <Button tono="contorno" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
        )}

        {enRevision ? (
          // `key` distinto del de «Siguiente»: así son dos nodos del DOM y no
          // uno que cambia de tipo mientras el navegador lo está activando.
          <Button
            key="confirmar"
            type="button"
            tono="primary"
            cargando={enviando}
            icono={<Check className="size-4" />}
            onClick={() => void form.handleSubmit(onEnviar)()}
          >
            {textoEnviar}
          </Button>
        ) : (
          <Button
            key="avanzar"
            type="button"
            tono="primary"
            iconoFinal={<ArrowRight className="size-4" />}
            onClick={() => void avanzar()}
            disabled={enviando}
          >
            Siguiente
          </Button>
        )}
      </FormActions>
    </form>
  );
}

/**
 * Una línea de la revisión: qué campo y qué valor.
 *
 * Existe para que cada formulario no invente su propia forma de enseñar lo
 * mismo. El valor vacío se dice con una raya, no se deja en blanco: en blanco
 * no se distingue «no puse nada» de «esto no se guarda».
 */
export function ResumenDato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const vacio = children === null || children === undefined || children === '';

  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-xs text-on-surface-variant">{etiqueta}</dt>
      <dd
        className={cn(
          'min-w-0 truncate text-right text-xs font-medium',
          vacio ? 'text-on-surface-variant/60' : 'text-on-surface',
        )}
        data-tabular
      >
        {vacio ? '—' : children}
      </dd>
    </div>
  );
}

/** El bloque que agrupa las líneas de la revisión, con su título. */
export function ResumenGrupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2">
      <h4 className="label-caps border-b border-outline-variant/60 pb-2 text-on-surface-variant">
        {titulo}
      </h4>
      <dl className="divide-y divide-outline-variant/40">{children}</dl>
    </section>
  );
}
