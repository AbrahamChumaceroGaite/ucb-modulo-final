import type { Metadata } from 'next';
import { ThemeToggle } from '@/shared/ui/primitives';
import { BottomNav, HeaderShell } from '@/shared/ui/patterns';

export const metadata: Metadata = {
  title: 'Sistema de diseño',
  description: 'Catálogo de los componentes de Kaffehaus y las reglas que los gobiernan.',
};

/**
 * Armazón del catálogo.
 *
 * No usa el armazón del panel porque no necesita sesión: es documentación del
 * sistema de diseño, no producto. El guardia de rutas lo devuelve como 404 en
 * producción — auditamos un panel cuya pantalla de escaparate era el 17,7 % del
 * código y viajaba a clientes reales.
 *
 * Lo que **sí** comparte es la cabecera. Tuvo una escrita a mano aquí dentro,
 * cuadrada y sin la animación del original: una copia que se quedó atrás en
 * cuanto la de verdad cambió. Ahora las dos salen de `<HeaderShell>` y lo
 * único que difiere son sus hijos.
 */
export default function DemoUiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <HeaderShell>
        <span className="label-caps truncate rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 text-on-surface-variant">
          Sistema de diseño
        </span>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </HeaderShell>

      <main className="mx-auto w-full max-w-[var(--spacing-lienzo)] flex-1 px-4 pb-28 pt-6 sm:px-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
