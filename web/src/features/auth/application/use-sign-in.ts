'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/config/routes';
import type { Credentials } from '../domain/session.schema';
import { authApi } from '../infrastructure/auth.api';

export function useSignIn() {
  const router = useRouter();
  return useMutation({
    mutationFn: (credentials: Credentials) => authApi.signIn(credentials),
    onSuccess: () => {
      router.push(ROUTES.expiryRisk);
      // The panel layout reads the cookie on the server: refresh so it sees the new session.
      router.refresh();
    },
  });
}
