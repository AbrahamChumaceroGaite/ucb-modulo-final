'use client';

import { useSyncExternalStore } from 'react';
import { VISTAS, type Vista } from './view';

/**
 * Cómo prefiere mirar los listados quien está usando el panel.
 *
 * ## Esto NO sustituye a la URL
 *
 * La regla 8.11 sigue en pie: **lo que se está mirando vive en la dirección**,
 * para que una lista se pueda compartir por enlace. Lo que se guarda aquí es
 * otra cosa — el **valor por omisión** cuando la dirección no dice nada—, y el
 * orden de precedencia lo deja claro:
 *
 * 1. Si la URL trae `?vista=tabla`, manda la URL. Siempre. Un enlace recibido
 *    tiene que enseñar lo mismo a quien lo manda y a quien lo abre.
 * 2. Si no la trae, se usa lo último que esa persona eligió en esa pantalla.
 * 3. Si tampoco hay nada guardado, `rejilla`.
 *
 * ## Por qué una preferencia por pantalla y no una global
 *
 * Porque las colecciones no se miran igual: una tabla es lo natural para
 * cuadrar ventas y las tarjetas lo son para barrer la despensa buscando qué
 * reponer. Una sola preferencia obligaría a cambiar de vista al entrar en cada
 * pantalla, que es justo el trabajo que esto ahorra.
 *
 * Si algún día se decide que sea global, se cambia la clave y ya está: es una
 * línea, porque el nombre de la pantalla es el único argumento.
 *
 * ## Por qué `useSyncExternalStore` y no `useState` + `useEffect`
 *
 * Porque en el servidor no hay `localStorage`. `getServerSnapshot` devuelve
 * `null` —«no sé»—, así que el HTML del servidor y el primer render del
 * cliente coinciden, y React vuelve a renderizar con la preferencia ya leída.
 * Con `useState` + efecto el resultado es el mismo, pero sin que React sepa
 * que hay una fuente externa: el aviso de desajuste de hidratación aparece en
 * cuanto alguien quiera leerla durante el render.
 *
 * **Sigue habiendo un parpadeo** —un render con la vista por omisión antes de
 * aplicar la guardada— y no se puede evitar leyendo antes: el servidor no
 * tiene acceso a esto. Es el precio de guardarlo en el navegador, y se nota
 * poco porque la lista todavía está cargando cuando ocurre.
 *
 * ## Por qué `localStorage` y no una cookie
 *
 * Porque no es un dato que el servidor necesite: no cambia lo que se
 * renderiza, solo lo que se prefiere. Mandarlo en cada petición sería pagar
 * ancho de banda por nada.
 */
const PREFIJO = 'kh:vista:';

const oyentes = new Set<() => void>();

/** `localStorage` puede lanzar: modo privado, cookies bloqueadas, cuota. */
function leer(clave: string): Vista | null {
  try {
    const guardada = window.localStorage.getItem(PREFIJO + clave);
    return esVista(guardada) ? guardada : null;
  } catch {
    return null;
  }
}

function esVista(valor: string | null): valor is Vista {
  return valor !== null && (VISTAS as readonly string[]).includes(valor);
}

/**
 * Guarda la elección. Si el navegador no deja escribir, **no pasa nada**: la
 * pantalla sigue funcionando, solo que no lo recordará la próxima vez. Una
 * preferencia no es un dato que se pueda perder con consecuencias.
 */
export function recordarVista(clave: string, vista: Vista): void {
  try {
    window.localStorage.setItem(PREFIJO + clave, vista);
  } catch {
    // Sin recordar, pero sin romper.
  }
  for (const avisar of oyentes) avisar();
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);

  // Otra pestaña del mismo panel también cambia la preferencia.
  const alCambiarOtraPestana = (evento: StorageEvent) => {
    if (evento.key?.startsWith(PREFIJO)) avisar();
  };
  window.addEventListener('storage', alCambiarOtraPestana);

  return () => {
    oyentes.delete(avisar);
    window.removeEventListener('storage', alCambiarOtraPestana);
  };
}

/**
 * La vista que toca pintar: la de la URL si la hay, la recordada si no.
 *
 * `enUrl` llega tal cual de `searchParams`, sin validar: si alguien escribe
 * `?vista=tarta` a mano, no se respeta ni se guarda — se cae a la preferencia,
 * que es lo que menos sorprende.
 */
export function useVistaPreferida(clave: string, enUrl: string | null): Vista {
  const guardada = useSyncExternalStore(
    suscribir,
    () => leer(clave),
    () => null,
  );

  if (esVista(enUrl)) return enUrl;
  return guardada ?? 'rejilla';
}
