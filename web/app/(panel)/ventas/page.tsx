import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VentaView } from '@/features/ventas';
import { SkeletonCard } from '@/shared/ui/primitives';

export const metadata: Metadata = {
  title: 'Ventas',
  description: 'Lo que sale por la barra de Kaffehaus, ticket a ticket.',
};

/**
 * La ruta solo enruta. Toda la pantalla vive en la feature.
 *
 * El `<Suspense>` es obligatorio, no decorativo: la vista lee `useSearchParams`
 * y sin él Next no puede prerenderizar esta ruta.
 */
export default function VentasPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <VentaView />
    </Suspense>
  );
}
