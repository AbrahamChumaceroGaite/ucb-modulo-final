import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VencimientoView } from '@/features/vencimientos';
import { SkeletonCard } from '@/shared/ui/primitives';

export const metadata: Metadata = {
  title: 'Riesgo de vencimiento',
  description: 'Qué lotes de la despensa de Kaffehaus conviene usar primero para que no se pierdan.',
};

/**
 * Inventario: lo primero que existe aquí es el riesgo de vencimiento de los
 * lotes. El registro de entradas y salidas sigue pendiente; cuando llegue,
 * será otra pestaña de esta misma ruta, como las de Personal.
 *
 * La ruta solo enruta. El `<Suspense>` es obligatorio: la vista lee
 * `useSearchParams` y sin él Next no puede prerenderizar.
 */
export default function InventarioPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <VencimientoView />
    </Suspense>
  );
}
