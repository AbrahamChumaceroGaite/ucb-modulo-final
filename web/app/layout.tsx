import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { SCRIPT_TEMA } from '@/shared/ui/primitives';
import { Providers } from './providers';
import './globals.css';

/**
 * Inter para trabajar, Playfair para la portada.
 *
 * `display: 'swap'` para que el texto se lea desde el primer pintado aunque la
 * fuente tarde. Las variables se exponen con el nombre que espera `@theme`.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--fuente-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--fuente-playfair',
  display: 'swap',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Kaffehaus',
    // Cada ruta pone su propio título. Auditamos un panel con el mismo título
    // de scaffolding en sus diez pantallas.
    template: '%s · Kaffehaus',
  },
  description: 'Gestión de una cafetería: carta, insumos y equipo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `lang="es"`: la aplicación está en español y un lector de pantalla tiene
    // que pronunciarla como tal.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica el tema antes del primer pintado. Si esperara a React, la
            página aparecería en claro y saltaría a oscuro un instante después. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                'rounded-md border border-outline-variant bg-surface-container-high text-on-surface text-sm',
            },
          }}
        />
      </body>
    </html>
  );
}
