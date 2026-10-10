import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', weight: ['600', '700'] });

export const metadata: Metadata = {
  title: { default: 'Kaffehaus', template: '%s · Kaffehaus' },
  description: 'Qué lotes perecederos de la cafetería conviene usar primero.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Font variables on <html>, where the theme reads them.
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
