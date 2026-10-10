import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Configuración de las pruebas.
 *
 * `jsdom` porque la mitad de lo que hay que comprobar es comportamiento de
 * interfaz —que un diálogo NO cierre al pulsar fuera, que un paso no avance
 * con un campo inválido—, y eso no se demuestra leyendo el código.
 *
 * El alias `@` repite el de `tsconfig.json`. Es la única duplicación de
 * configuración del proyecto y no hay forma de evitarla: Vitest no lee los
 * `paths` de TypeScript.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
