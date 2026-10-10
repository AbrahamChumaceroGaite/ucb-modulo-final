import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductoView } from '@/features/productos';
import { SkeletonCard } from '@/shared/ui/primitives';

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Lo que hay en la despensa de Kaffehaus, lo que se vende y cuánto queda.',
};

/**
 * La ruta solo enruta. Toda la pantalla vive en la feature.
 *
 * El `Suspense` es obligatorio: la vista lee `useSearchParams`, y sin un límite
 * de suspensión Next no puede prerenderizar esta ruta.
 */
export default function ProductosPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <ProductoView />
    </Suspense>
  );
}
