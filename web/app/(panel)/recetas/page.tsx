import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RecetaView } from '@/features/recetas';
import { SkeletonCard } from '@/shared/ui/primitives';

export const metadata: Metadata = {
  title: 'Recetas',
  description: 'Qué lleva cada bebida y cada plato de la carta de Kaffehaus.',
};

/**
 * La ruta solo enruta. Toda la pantalla vive en la feature.
 *
 * El `<Suspense>` es obligatorio, no decorativo: la vista lee `useSearchParams`
 * y sin él Next no puede prerenderizar esta ruta.
 */
export default function RecetasPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <RecetaView />
    </Suspense>
  );
}
