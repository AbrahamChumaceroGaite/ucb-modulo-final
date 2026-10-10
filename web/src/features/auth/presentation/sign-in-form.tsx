'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { Field, controlClass } from '@/shared/ui/field';
import { useSignIn } from '../application/use-sign-in';
import { credentialsSchema } from '../domain/session.schema';

export function SignInForm() {
  const signIn = useSignIn();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = formState;

  return (
    <form noValidate onSubmit={handleSubmit((credentials) => signIn.mutate(credentials))} className="flex flex-col gap-3">
      <Field label="Correo" error={errors.email?.message}>
        <input type="email" autoComplete="username" className={controlClass} {...register('email')} />
      </Field>
      <Field label="Contraseña" error={errors.password?.message}>
        <input type="password" autoComplete="current-password" className={controlClass} {...register('password')} />
      </Field>
      {signIn.error ? <ErrorNotice title="No se pudo entrar" error={signIn.error} /> : null}
      {/* Stays busy after success too: the page is about to change. */}
      <Button type="submit" variant="primary" loading={signIn.isPending || signIn.isSuccess}>
        Entrar
      </Button>
    </form>
  );
}
