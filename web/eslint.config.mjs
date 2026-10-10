import next from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * Layer rules:
 *
 *   app → feature barrel (or its server/) → shared
 *   presentation → application → infrastructure → domain
 *
 * In flat config two blocks on the same files do not merge
 * `no-restricted-imports` (the last one wins), so each layer gets its
 * complete list from `restrict`.
 */
const LAYER = {
  presentation: ['**/presentation/**', 'La capa de abajo no importa a presentation.'],
  application: ['**/application/**', 'La capa de abajo no importa a application.'],
  infrastructure: ['**/infrastructure/**', 'Solo application habla con infrastructure.'],
  server: ['**/server/**', 'El código de servidor solo lo importa app/.'],
  otherFeature: ['@/features/**', 'Una feature no importa otra; lo común baja a shared.'],
  framework: ['react', 'react-dom', 'next', 'next/**', '@tanstack/**', 'El dominio es TypeScript puro.'],
};

function restrict(files, ...rules) {
  const patterns = rules.map((rule) => ({ group: rule.slice(0, -1), message: rule.at(-1) }));
  return { files, rules: { 'no-restricted-imports': ['error', { patterns }] } };
}

const config = [
  ...next,
  ...typescript,
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'error',
    },
  },
  restrict(['src/features/*/domain/**'], LAYER.presentation, LAYER.application, LAYER.infrastructure, LAYER.server, LAYER.otherFeature, LAYER.framework),
  restrict(['src/features/*/infrastructure/**'], LAYER.presentation, LAYER.application, LAYER.server, LAYER.otherFeature),
  restrict(['src/features/*/application/**'], LAYER.presentation, LAYER.server, LAYER.otherFeature),
  restrict(['src/features/*/presentation/**'], LAYER.infrastructure, LAYER.server, LAYER.otherFeature),
  restrict(['src/features/*/server/**'], LAYER.presentation, LAYER.application, LAYER.infrastructure, LAYER.otherFeature),
  restrict(['src/shared/**'], ['@/features/**', 'shared no sabe nada de las features.']),
  restrict(
    ['app/**'],
    [
      '@/features/*/domain/**',
      '@/features/*/application/**',
      '@/features/*/infrastructure/**',
      '@/features/*/presentation/**',
      'app/ entra a una feature por su index.ts o por su server/.',
    ],
  ),
  // Tests may gather data from several layers of their own feature.
  { files: ['src/**/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': 'off' } },
];

export default config;
