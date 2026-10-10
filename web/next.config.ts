import type { NextConfig } from 'next';

/**
 * Sin `typescript.ignoreBuildErrors` y sin `eslint.ignoreDuringBuilds`.
 *
 * Auditamos un proyecto que los tenía activados y acumuló 267 errores de tipos
 * invisibles durante meses. Si el build no puede fallar, deja de ser una prueba.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // La API de Spring no sirve imágenes todavía; las del showcase son locales.
    remotePatterns: [],
  },
};

export default nextConfig;
