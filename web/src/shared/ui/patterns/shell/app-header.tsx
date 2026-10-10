'use client';

import { LogOut, User } from 'lucide-react';
import { HeaderShell } from './header-shell';
import { SearchInput } from '../../primitives/fields/search-input';
import { ThemeToggle } from '../../primitives/theme/theme-toggle';
import { Avatar } from '../../primitives/display/avatar';
import { MenuItem, MenuSeparator, Popover } from '../../primitives/overlays/popover';

/**
 * Barra superior del panel.
 *
 * El buscador **es de verdad**, no un disparador de otra cosa: se escribe aquí
 * y el listado de la pantalla se acota. Vive en la cabecera y no dentro de cada
 * listado porque siempre está en el mismo sitio y así se encuentra sin buscarlo.
 *
 * El menú de la persona solo tiene entradas que funcionan. Auditamos un panel
 * con «Mi perfil», «Preferencias» y «Sesiones activas» donde las tres mostraban
 * un aviso que decía literalmente «Opción seleccionada: perfil», en producción.
 *
 * La forma, el despegue al bajar y la marca los pone `<HeaderShell>`. Aquí
 * solo va lo que esta barra tiene y la del catálogo no: buscador y cuenta.
 */
export function AppHeader({
  busqueda,
  onBuscar,
  marcadorBusqueda,
  usuario,
  onSalir,
}: {
  busqueda?: string;
  onBuscar?: (termino: string) => void;
  marcadorBusqueda?: string;
  usuario: { nombre: string; rol: string };
  onSalir?: () => void;
}) {
  return (
    <HeaderShell>
      {onBuscar && (
        <div className="min-w-0 max-w-md flex-1">
          <SearchInput
            valor={busqueda ?? ''}
            onBuscar={onBuscar}
            marcador={marcadorBusqueda ?? 'Buscar…'}
          />
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <ThemeToggle />

        <Popover
          alineacion="fin"
          disparador={({ abierto, alternar }) => (
            <button
              type="button"
              onClick={alternar}
              aria-expanded={abierto}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-surface-container-high"
            >
              <Avatar nombre={usuario.nombre} medida="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium leading-tight text-on-surface">
                  {usuario.nombre}
                </span>
                <span className="block text-[0.625rem] leading-tight text-on-surface-variant">
                  {usuario.rol}
                </span>
              </span>
            </button>
          )}
        >
          {({ cerrar }) => (
            <div role="menu" aria-label="Menú de la cuenta">
              <div className="px-2.5 py-2">
                <p className="text-xs font-medium text-on-surface">{usuario.nombre}</p>
                <p className="text-[0.625rem] text-on-surface-variant">{usuario.rol}</p>
              </div>

              <MenuSeparator />

              <MenuItem icono={<User className="size-4" />} onClick={cerrar}>
                Mi cuenta
              </MenuItem>

              {onSalir && (
                <MenuItem
                  icono={<LogOut className="size-4" />}
                  tono="danger"
                  onClick={() => {
                    cerrar();
                    onSalir();
                  }}
                >
                  Cerrar sesión
                </MenuItem>
              )}
            </div>
          )}
        </Popover>
      </div>
    </HeaderShell>
  );
}
