import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Layer rules: domain ← application ← infrastructure / presentation.
 * - domain: no Nest, pg, jsonwebtoken or outer layers.
 * - application: ports only; the logger is the one infrastructure import allowed.
 * - the two contexts never import each other; they share `src/libs`.
 * Flat config keeps only the last matching `no-restricted-imports`, so each
 * (context, layer) pair gets one rule. Spec files are not checked.
 */
const SPECS = ['**/*.spec.ts'];
const CONTEXTS = ['auth', 'expiry_risk'];
const FRAMEWORKS = ['@nestjs/*', 'pg', 'jsonwebtoken', 'class-validator', 'class-transformer'];
const libs = (layer) => [`@libs/${layer}`, `@libs/${layer}/*`];

const FORBIDDEN = {
  domain: [...FRAMEWORKS, ...libs('application'), ...libs('infrastructure'), ...libs('presentation'), '**/application/**', '**/infrastructure/**', '**/presentation/**'],
  application: ['pg', 'jsonwebtoken', ...libs('presentation'), '**/presentation/**'],
  infrastructure: [...libs('presentation'), '**/presentation/**'],
  presentation: [],
};

const MESSAGE = 'Esta capa no puede depender de ese módulo.';

// A regex because glob patterns cannot re-include a file inside an excluded folder.
const APPLICATION_INFRASTRUCTURE = { regex: String.raw`^(?!@libs/infrastructure/monitoring/logger\.service$).*infrastructure`, message: MESSAGE };

const restrict = (group, extra = []) => ({
  'no-restricted-imports': ['error', { patterns: [{ group, message: MESSAGE }, ...extra] }],
});
const extraFor = (layer) => (layer === 'application' ? [APPLICATION_INFRASTRUCTURE] : []);

const layerRules = Object.entries(FORBIDDEN).flatMap(([layer, patterns]) => [
  { files: [`src/libs/${layer}/**/*.ts`], ignores: SPECS, rules: restrict(patterns.length ? patterns : ['__none__'], extraFor(layer)) },
  ...CONTEXTS.map((context) => {
    const others = CONTEXTS.filter((name) => name !== context).map((name) => `**/${name}/**`);
    return { files: [`src/contexts/${context}/${layer}/**/*.ts`], ignores: SPECS, rules: restrict([...others, ...patterns], extraFor(layer)) };
  }),
]);

const contextRootRules = CONTEXTS.map((context) => ({
  files: [`src/contexts/${context}/*.ts`],
  rules: restrict(CONTEXTS.filter((name) => name !== context).map((name) => `**/${name}/**`)),
}));

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'training/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  ...contextRootRules,
  ...layerRules,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: { console: 'readonly' } } },
);
