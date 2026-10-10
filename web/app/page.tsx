import type { Metadata } from 'next';
import { Coffee, Wheat } from 'lucide-react';
import { LoginForm } from '@/features/auth';
import { ThemeToggle } from '@/shared/ui/primitives';
import { CAPACIDADES } from './_data/capacidades';

export const metadata: Metadata = {
  title: 'Entrar',
  description:
    'Kaffehaus: el mostrador, la despensa y el equipo de la cafetería en un solo sitio.',
};

/**
 * Portada y acceso.
 *
 * Es la única pantalla con Playfair: el resto del producto es una herramienta
 * de trabajo y usa Inter. Aquí el tipo serif hace el trabajo de decir qué clase
 * de sitio es esto antes de que nadie lea una palabra.
 *
 * El formulario vive a la derecha en escritorio y debajo en móvil, porque quien
 * entra desde el teléfono a las seis de la mañana quiere el campo de correo, no
 * la ilustración.
 */
export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface">
      {/* Grano de café gigante al fondo: la misma marca tenue y girada que
          llevan las tarjetas del panel, a escala de portada. */}
      <Coffee
        className="pointer-events-none absolute -left-24 -top-24 size-[32rem] rotate-12 text-primary opacity-[0.04]"
        aria-hidden
      />
      <Wheat
        className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem] -rotate-12 text-secondary opacity-[0.05]"
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col items-center justify-center gap-10 px-5 py-16 lg:flex-row lg:gap-16">
        <section className="w-full max-w-lg">
          <span className="label-caps inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-on-surface-variant">
            <Coffee className="size-3.5" aria-hidden />
            Tostaduría y cafetería
          </span>

          <h1 className="mt-5 font-display text-4xl leading-[1.1] font-bold text-on-surface sm:text-5xl">
            El mostrador y la despensa,
            <span className="block text-secondary">en la misma pantalla.</span>
          </h1>

          <p className="mt-4 max-w-md text-base text-on-surface-variant">
            Kaffehaus lleva la cuenta de lo que hay en el almacén, de lo que sale por la barra y
            de quién está en turno. Sin planillas sueltas ni cuadernos detrás de la caja.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {CAPACIDADES.map((capacidad) => (
              <li
                key={capacidad.titulo}
                className="rounded-md border border-outline-variant bg-surface-container/60 p-3"
              >
                <capacidad.Icono className="size-4 text-secondary" aria-hidden />
                <p className="mt-2 text-xs font-semibold text-on-surface">{capacidad.titulo}</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">{capacidad.detalle}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[var(--shadow-flotante)]">
            {/* Franja de tueste: del grano oscuro al tostado claro. Es lo
                primero que se ve de la marca y no cuesta un componente. */}
            <div
              aria-hidden
              className="h-1.5 bg-linear-to-r from-primary via-secondary to-primary"
            />

            <div className="px-6 pt-5 pb-6">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 -rotate-6 items-center justify-center rounded-md bg-primary text-on-primary"
                >
                  <Coffee className="size-5" />
                </span>

                <div className="min-w-0">
                  <h2 className="font-display text-xl leading-tight font-bold text-on-surface">
                    Entrar al panel
                  </h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Con el correo que te dio el encargado.
                  </p>
                </div>
              </div>

              <LoginForm className="mt-5" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

