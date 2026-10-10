import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PersonalView } from '@/features/personal';
import { SkeletonCard } from '@/shared/ui/primitives';

export const metadata: Metadata = {
  title: 'Usuarios',
  description: 'Las cuentas del equipo de Kaffehaus y la libreta de clientes.',
};

/**
 * La ruta solo enruta. Toda la pantalla vive en la feature.
 *
 * La URL dice `/usuarios` porque es lo que dice el menú, y la feature se llama
 * `personal` porque es el contexto que agrupa a usuarios y clientes —el mismo
 * nombre que usa el backend—. La pestaña de clientes es `?tipo=clientes`: son
 * dos vistas de lo mismo, no dos rutas.
 *
 * El `Suspense` es obligatorio: la vista lee `useSearchParams`, y sin un
 * límite de suspensión Next no puede prerenderizar esta ruta.
 */
export default function UsuariosPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <PersonalView />
    </Suspense>
  );
}
