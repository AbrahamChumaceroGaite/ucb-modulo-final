'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/config/routes';
import { authApi } from '../infrastructure/auth.api';

export function useSignOut() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.signOut(),
    // Leave even if the call failed.
    onSettled: () => {
      router.push(ROUTES.signIn);
      router.refresh();
    },
  });
}
