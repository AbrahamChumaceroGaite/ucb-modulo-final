import type { ParamsListado } from '@/shared/api/paginated';

/**
 * Claves de caché del contexto Personal. Nadie escribe un array a mano.
 *
 * Usuarios y clientes tienen su propia rama porque son dos colecciones
 * distintas: invalidar una no debe recargar la otra. Comparten archivo porque
 * comparten pantalla y porque la forma de la clave tiene que ser idéntica —si
 * una usa `['usuario','lista',params]` y otra `['clientes',params]`, la
 * invalidación empieza a fallar en el sitio que nadie mira.
 */
function ramaDe(raiz: string) {
  const all = [raiz] as const;
  return {
    all,
    listas: () => [...all, 'lista'] as const,
    lista: (params: ParamsListado) => [...all, 'lista', params] as const,
    detalles: () => [...all, 'detalle'] as const,
    detalle: (id: string) => [...all, 'detalle', id] as const,
  };
}

export const usuarioKeys = ramaDe('usuario');
export const clienteKeys = ramaDe('cliente');
