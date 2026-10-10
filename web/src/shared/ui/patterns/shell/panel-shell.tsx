'use client';

import { useCallback, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from './app-header';
import { BottomNav } from './bottom-nav';

/**
 * Armazón del panel: cabecera, contenido y menú flotante.
 *
 * ## El buscador escribe en la URL
 *
 * La cabecera es la misma en todas las pantallas, así que su buscador no puede
 * conocer el listado de cada una. Lo que hace es escribir `?search=` y volver a
 * la primera página; cada pantalla lee ese parámetro y pide lo suyo.
 *
 * Así la búsqueda se puede compartir por enlace, sobrevive a una recarga y no
 * existe en dos sitios a la vez. Auditamos un proyecto donde el estado del
 * listado vivía en un store y la URL no sabía nada: compartir una vista
 * filtrada era imposible.
 */
export function PanelShell({
  usuario,
  onSalir,
  marcadorBusqueda,
  children,
}: {
  usuario: { nombre: string; rol: string };
  onSalir?: () => void;
  marcadorBusqueda?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();

  const buscar = useCallback(
    (termino: string) => {
      const siguientes = new URLSearchParams(parametros.toString());

      if (termino) siguientes.set('search', termino);
      else siguientes.delete('search');

      // Buscar vuelve al principio: quedarse en la página 3 de un resultado
      // que ahora tiene una sola deja la pantalla vacía sin explicación.
      siguientes.delete('skip');

      const consulta = siguientes.toString();
      router.replace(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
    },
    [parametros, router, ruta],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <AppHeader
        usuario={usuario}
        onSalir={onSalir}
        busqueda={parametros.get('search') ?? ''}
        onBuscar={buscar}
        marcadorBusqueda={marcadorBusqueda}
      />

      {/* El hueco de abajo deja sitio al menú flotante para que no tape la
          última fila de la tabla ni el último botón del formulario. */}
      <main className="mx-auto w-full max-w-[var(--spacing-lienzo)] flex-1 px-4 pb-28 pt-6 sm:px-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
