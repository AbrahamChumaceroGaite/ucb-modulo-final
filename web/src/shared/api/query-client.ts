import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

/**
 * Configuración única de la caché de servidor.
 *
 * Esto es lo que sustituye a un store de Redux. Auditamos un proyecto Angular
 * donde 49 de 52 selectores eran `s => s.campo` y la capa de estado pesaba
 * 5.063 líneas para transportar datos sin transformarlos.
 */
export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Un catálogo de cafetería no cambia cada segundo. Medio minuto evita
        // repedir lo mismo al volver de otra pestaña sin quedarse obsoleto.
        staleTime: 30_000,
        retry: (intentos, error) => {
          // Un 404 o un 403 no mejoran repitiéndolos.
          if (error instanceof ApiError && error.codigo < 500) return false;
          return intentos < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false, // una escritura no se reintenta sola: podría duplicar
      },
    },
  });
}
