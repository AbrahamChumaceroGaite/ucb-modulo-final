'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { crearQueryClient } from '@/shared/api/query-client';

/**
 * Proveedores de cliente.
 *
 * El `QueryClient` se crea con `useState` y no como constante de módulo: en el
 * servidor, una constante de módulo se compartiría entre peticiones de personas
 * distintas y con ella la caché. Así cada cliente tiene la suya.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [cliente] = useState(crearQueryClient);

  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
