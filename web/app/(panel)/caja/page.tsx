import type { Metadata } from 'next';
import { Wallet } from 'lucide-react';
import { EmptyState, PageHeader } from '@/shared/ui/patterns';

export const metadata: Metadata = {
  title: 'Caja',
  description: 'Apertura, arqueo y cierre del turno en Kaffehaus.',
};

/**
 * Caja: la pantalla existe, la feature todavía no. Ver `ventas/page.tsx` para
 * el criterio.
 */
export default function CajaPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        migas={[{ etiqueta: 'Inicio', href: '/productos' }, { etiqueta: 'Caja' }]}
        titulo="Caja"
        descripcion="Con cuánto se abre, con cuánto se cierra y qué falta."
      />

      <EmptyState
        icono={<Wallet className="size-5" />}
        titulo="No hay ningún turno abierto"
        mensaje="Aquí se abrirá la caja al empezar el turno, se contará lo que hay al cerrarlo y quedará la diferencia anotada con su explicación. Necesita que Ventas exista primero: sin tickets no hay nada que cuadrar."
      />
    </div>
  );
}
