'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Button, Field, Input, SegmentedControl } from '@/shared/ui/primitives';
import { FormActions, FormLayout, FormRow, FormField } from '@/shared/ui/patterns';
import { cn } from '@/shared/lib/cn';
import { accesoSchema, type Acceso } from '../../domain/sesion.schema';
import { PERFILES, PERFIL_POR_DEFECTO, definicionDePerfil, type Perfil } from '../../domain/perfil';
import { useLogin } from '../../application/use-login';
import { GoogleBoton } from './google-boton';
import { ICONO_POR_PERFIL } from './login-form.data';

/**
 * Formulario de acceso.
 *
 * El esquema que valida aquí es **el mismo** que describe lo que la API acepta:
 * una sola definición para el formulario y para la petición. El mensaje de cada
 * regla viaja pegado a la regla, así que el mínimo de la contraseña y el texto
 * que lo anuncia no pueden desincronizarse.
 *
 * El perfil se elige arriba del todo porque cambia lo que pasa al entrar, y
 * decidirlo después de teclear la contraseña obligaría a volver hacia atrás.
 */
export function LoginForm({ className }: { className?: string }) {
  const login = useLogin();

  const form = useForm<Acceso>({
    resolver: zodResolver(accesoSchema),
    defaultValues: { email: '', password: '', perfil: PERFIL_POR_DEFECTO },
  });

  return (
    <form
      onSubmit={form.handleSubmit((valores) => login.mutate(valores))}
      noValidate
      className={className}
    >
      <FormLayout>
        <FormRow>
          <FormField>
            <Controller
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <SegmentedControl<Perfil>
                    etiquetaGrupo="Con qué perfil entras"
                    opciones={PERFILES.map((perfil) => {
                      const Icono = ICONO_POR_PERFIL[perfil.valor];
                      return {
                        valor: perfil.valor,
                        etiqueta: perfil.etiqueta,
                        icono: <Icono className="size-4" aria-hidden />,
                      };
                    })}
                    valor={field.value}
                    onCambiar={field.onChange}
                  />

                  {/* Que el interruptor diga en voz alta qué hace. Un par de
                      pestañas que solo cambian de color no explican nada. */}
                  <p
                    className="px-1 text-xs text-on-surface-variant"
                    // `polite` y no `assertive`: es una aclaración, no una
                    // alarma; no debe cortar lo que el lector esté diciendo.
                    aria-live="polite"
                  >
                    {definicionDePerfil(field.value).queHace}
                  </p>
                </div>
              )}
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Field etiqueta="Correo" requerido error={form.formState.errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="tu@kaffehaus.bo"
                iconoInicio={<Mail className="size-4" />}
                {...form.register('email')}
              />
            </Field>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Field etiqueta="Contraseña" requerido error={form.formState.errors.password?.message}>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                iconoInicio={<KeyRound className="size-4" />}
                {...form.register('password')}
              />
            </Field>
          </FormField>
        </FormRow>

        <FormActions className="justify-stretch">
          <Button
            type="submit"
            tono="primary"
            bloque
            cargando={login.isPending}
            iconoFinal={<ArrowRight className="size-4" />}
          >
            Entrar
          </Button>
        </FormActions>
      </FormLayout>

      {/* La otra puerta. Va **después** del formulario y separada por su
          línea: el correo es la vía principal y Google la alternativa, no dos
          opciones al mismo nivel.

          Fuera del `<form>` no: está dentro, pero es un `<div>` de Google con
          su propio botón, así que no participa del envío. */}
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 rounded-full bg-outline-variant" aria-hidden />
          <span className="text-[0.6875rem] text-on-surface-variant">o entra con</span>
          <span className="h-px flex-1 rounded-full bg-outline-variant" aria-hidden />
        </div>

        <GoogleBoton />
      </div>

      {/* Línea de corte, como la de un tique de caja. Separa lo que se rellena
          de lo que solo se lee. */}
      <p
        className={cn(
          'mt-5 flex items-start gap-2 border-t border-dashed border-outline-variant pt-3',
          'text-[0.6875rem] leading-4 text-on-surface-variant',
        )}
      >
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
        La sesión se guarda en este equipo y se cierra sola cuando caduca. No la abras en un
        ordenador compartido con el público.
      </p>
    </form>
  );
}
