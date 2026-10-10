'use client';

import { HelpCircle } from 'lucide-react';
import { useTour, type PasoTour } from '@/shared/lib/tour/use-tour';
import { Tooltip } from '../../primitives/overlays/tooltip';
import { IconAction } from '../../primitives/actions/icon-action';

/**
 * Botón que lanza el recorrido guiado de la pantalla donde está.
 *
 * Existe porque el tour tiene que poder pedirse. Un recorrido que solo aparece
 * la primera vez y no se puede repetir es inútil justo cuando hace falta: el
 * día que alguien nuevo entra a cubrir un turno.
 */
export function HelpButton({ pasos, etiqueta = 'Cómo funciona esta pantalla' }: { pasos: readonly PasoTour[]; etiqueta?: string }) {
  const iniciarTour = useTour();

  return (
    <Tooltip contenido={etiqueta}>
      <IconAction
        accion="destacar"
        etiqueta={etiqueta}
        icono={<HelpCircle className="size-4" />}
        onClick={() => iniciarTour(pasos)}
      />
    </Tooltip>
  );
}
