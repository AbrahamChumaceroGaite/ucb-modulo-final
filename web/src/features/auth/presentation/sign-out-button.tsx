'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useSignOut } from '../application/use-sign-out';

export function SignOutButton() {
  const signOut = useSignOut();
  return (
    <Button
      variant="ghost"
      icon={<LogOut className="size-4" aria-hidden />}
      loading={signOut.isPending}
      onClick={() => signOut.mutate()}
    >
      Salir
    </Button>
  );
}
