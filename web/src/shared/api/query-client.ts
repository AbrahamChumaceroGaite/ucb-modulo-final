import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // A 4xx will not change by asking again.
        retry: (attempts, error) => !(error instanceof ApiError && error.status < 500) && attempts < 2,
      },
      mutations: { retry: false },
    },
  });
}
