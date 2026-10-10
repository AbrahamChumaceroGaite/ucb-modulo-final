import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/features/auth';
import { readSessionUser } from '@/features/auth/server/session-cookies';
import { ROUTES } from '@/shared/config/routes';

export const metadata: Metadata = { title: 'Entrar' };

export default async function SignInPage() {
  if (await readSessionUser()) redirect(ROUTES.expiryRisk);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm rounded-md border bg-surface-container-lowest p-6 shadow-raised">
        <h1 className="font-display text-3xl font-bold text-primary">Kaffehaus</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Entra con tu cuenta de la cafetería.
        </p>
        <div className="mt-6">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
