'use client';

import type { ReactNode } from 'react';
import { PanelShell } from '@/shared/ui/patterns';
import { ProveedorDeSesion, type SesionActual } from '@/shared/lib/sesion-actual';
import { useLogout } from '../../application/use-logout';

/**
 * Conecta el armazón del panel con la sesión.
 *
 * Existe porque `shared/` no puede conocer ninguna feature: `PanelShell` no
 * sabe cerrar sesión, solo recibe la función. Este componente es el puente, y
 * es de `auth` porque de eso trata.
 *
 * El layout del panel es un Server Component —lee la cookie— y esto es la hoja
 * de cliente mínima que necesita para tener un botón que funcione.
 *
 * ## También baja la sesión al resto del panel
 *
 * `<ProveedorDeSesion>` es tubería de `shared`; el contenido lo pone `auth`,
 * que es quien tiene el dato. Lo necesita `ventas`: una venta exige
 * `idUsuario`, y ese id es el de quien tiene la sesión, no una opción de un
 * desplegable. Sin esto, `ventas` tendría que importar `auth` — prohibido— o
 * pedir el vendedor en un formulario, que es peor.
 */
export function PanelSession({
  usuario,
  marcadorBusqueda,
  children,
}: {
  usuario: SesionActual;
  marcadorBusqueda?: string;
  children: ReactNode;
}) {
  const logout = useLogout();

  return (
    <ProveedorDeSesion sesion={usuario}>
      <PanelShell
        usuario={usuario}
        onSalir={() => logout.mutate()}
        marcadorBusqueda={marcadorBusqueda}
      >
        {children}
      </PanelShell>
    </ProveedorDeSesion>
  );
}
