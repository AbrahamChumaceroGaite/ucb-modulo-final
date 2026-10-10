import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Layer rules, checked by the linter instead of by discipline.
 *
 * domain ← application ← infrastructure / presentation. The domain knows
 * nothing about Nest, Postgres or tokens; the application talks to ports and
 * may log, nothing else from infrastructure; and the two contexts never
 * import each other (they only share `src/libs`).
 *
 * Flat config keeps only the last `no-restricted-imports` that matches a file,
 * so each (context, layer) pair gets one rule with every pattern it needs.
 * Specs are left out: a handler test may wire the real hasher next to a fake
 * repository, which is assembly, not a dependency of the layer.
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

// Logging is the one infrastructure piece a handler may use. A regex, because
// .gitignore patterns cannot re-include a file inside an excluded folder.
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
