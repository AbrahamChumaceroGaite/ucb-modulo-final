'use client';

import { useEffect, useState } from 'react';

/**
 * Responde si el viewport cumple una consulta de medios.
 *
 * ## Cuándo usar esto y cuándo una clase de Tailwind
 *
 * Casi nunca. Para **cómo se ve** algo, la clase (`sm:`, `lg:`) es mejor:
 * funciona sin JavaScript, no parpadea al hidratar y no duplica la escala.
 *
 * Esto es para cuando hay que decidir **qué se monta**, no cómo se pinta.
 * Ocultar con CSS un componente que abre un overlay no lo desactiva: su código
 * sigue corriendo. Nos costó un defecto real —`<DrawerPush>` montaba a la vez
 * el panel y la hoja, y la hoja invisible bloqueaba el desplazamiento de la
 * página y se llevaba el foco del teclado a un botón que nadie veía—.
 *
 * ## Por qué empieza en `false`
 *
 * En el servidor no hay viewport. Devolver `false` y corregir tras montar es
 * la única respuesta honesta; adivinar produce un desajuste de hidratación.
 * Por eso quien lo use debe tolerar un primer render en la rama estrecha.
 */
export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const medio = window.matchMedia(consulta);
    const alCambiar = () => setCoincide(medio.matches);

    alCambiar();
    medio.addEventListener('change', alCambiar);
    return () => medio.removeEventListener('change', alCambiar);
  }, [consulta]);

  return coincide;
}

/*
  Los dos cortes que el proyecto necesita **en JavaScript**, porque deciden qué
  se monta y no cómo se pinta. Son el `lg` y el `md` de Tailwind escritos a
  mano: duplicarlos es feo y no hay alternativa, así que están los dos aquí,
  juntos, para que se cambien a la vez que el tema.
*/

/** `lg`. A partir de aquí hay ancho para repartir entre contenido y panel. */
export const ANCHO_PARA_EMPUJAR = '(min-width: 64rem)';

/** `md`. Por debajo, los filtros no caben en línea y se van a una hoja. */
export const ANCHO_FILTROS_EN_LINEA = '(min-width: 48rem)';
