'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Quién está usando el panel, disponible para cualquier pantalla.
 *
 * ## Por qué existe
 *
 * `CrearVentaRequest` exige `idUsuario`: una venta la hace alguien, y ese
 * alguien es quien tiene la sesión abierta — no una opción de un desplegable.
 * Poner un selector de «vendedor» sería dejar que cualquiera registre ventas a
 * nombre de otro, además de pedir un dato que el sistema ya sabe.
 *
 * Hasta ahora el layout del panel solo pasaba el **nombre** y el **rol** a la
 * cabecera, porque no hacía falta más. El id se queda en el servidor, en la
 * cookie; esto lo baja al cliente para que una pantalla pueda mandarlo.
 *
 * ## Por qué en `shared` y no en `auth`
 *
 * Porque lo consume `ventas`, y una feature no importa otra. La regla que
 * resuelve esto es la misma de siempre: **`shared` pone la tubería, la feature
 * la llena**. Aquí solo hay un contexto de React y tres campos de texto — cero
 * dominio, cero llamadas, cero reglas. `auth` es quien lo provee, porque es
 * quien lee la cookie; `ventas` solo lee.
 *
 * Es el mismo patrón que `<PanelShell>`, que tampoco sabe cerrar sesión y
 * recibe la función de fuera.
 *
 * ## Por qué falla en vez de devolver `null`
 *
 * Un `null` silencioso acabaría mandando una venta sin vendedor, y el 400 del
 * servidor aparecería tres capas más adentro. Dentro del panel **siempre** hay
 * sesión —lo garantizan el guardia de rutas y el layout—, así que si esto se
 * usa fuera, es un error de montaje y tiene que doler al primer render.
 */
export type SesionActual = {
  usuarioId: string;
  nombre: string;
  rol: string;
};

const Contexto = createContext<SesionActual | null>(null);

export function ProveedorDeSesion({
  sesion,
  children,
}: {
  sesion: SesionActual;
  children: ReactNode;
}) {
  return <Contexto.Provider value={sesion}>{children}</Contexto.Provider>;
}

export function useSesionActual(): SesionActual {
  const sesion = useContext(Contexto);

  if (!sesion) {
    throw new Error(
      'useSesionActual se usó fuera del panel. Toda pantalla protegida se monta dentro de <ProveedorDeSesion>.',
    );
  }

  return sesion;
}
