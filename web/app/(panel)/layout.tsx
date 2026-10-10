import { redirect } from 'next/navigation';
import { SignOutButton } from '@/features/auth';
import { readSessionUser } from '@/features/auth/server/session-cookies';
import { ROUTES } from '@/shared/config/routes';

/**
 * Reads the session on the server, before rendering: without one the page is
 * never painted. Token validity is the API's job; an expired token comes
 * back as a 401 that the screen turns into "sign in again".
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await readSessionUser();
  if (!user) redirect(ROUTES.signIn);

  return (
    <div className="min-h-dvh">
      <header className="border-b bg-surface-container-lowest">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <span className="font-display text-xl font-bold text-primary">Kaffehaus</span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden truncate text-sm text-on-surface-variant sm:inline">
              {user.fullName} · {user.roleName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
