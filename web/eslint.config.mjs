import next from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';

/**
 * La regla de dependencias no se cumple por disciplina: la comprueba el CI.
 *
 * Auditamos dos proyectos donde la regla estaba escrita en comentarios y aun
 * así se rompió. Aquí `app → features → shared`, `domain` no importa de nadie,
 * y si alguien escribe una importación hacia arriba o cierra un ciclo, el lint
 * falla y el build con él.
 */
const configuracion = [
  ...next,
  ...typescript,

  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'scripts/**'] },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['app/**/*', 'src/**/*'],
      'boundaries/elements': [
        // El orden importa: gana el primer patrón que encaje.
        { type: 'feature-barrel', pattern: 'src/features/*/index.ts', mode: 'file', capture: ['feature'] },
        { type: 'domain', pattern: 'src/features/*/domain/**/*', mode: 'file', capture: ['feature'] },
        { type: 'infrastructure', pattern: 'src/features/*/infrastructure/**/*', mode: 'file', capture: ['feature'] },
        { type: 'application', pattern: 'src/features/*/application/**/*', mode: 'file', capture: ['feature'] },
        { type: 'presentation', pattern: 'src/features/*/presentation/**/*', mode: 'file', capture: ['feature'] },
        { type: 'feature-server', pattern: 'src/features/*/server/**/*', mode: 'file', capture: ['feature'] },
        { type: 'shared', pattern: 'src/shared/**/*', mode: 'file' },
        { type: 'app', pattern: 'app/**/*', mode: 'file' },
      ],
    },
    rules: {
      // Un ciclo de importación es un fallo de build, no una advertencia.
      'import/no-cycle': ['error', { maxDepth: 10 }],

      // Nadie usa `any`, y tampoco su disfraz: la doble aserción.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          // `app` puede tocar el barril de una feature, su capa de servidor
          // (los Route Handlers son su mitad de servidor) y `shared`.
          rules: [
            { from: ['app'], allow: ['app', 'feature-barrel', 'feature-server', 'shared'] },
            {
              from: ['feature-barrel'],
              allow: [
                ['presentation', { feature: '${from.feature}' }],
                ['domain', { feature: '${from.feature}' }],
                ['application', { feature: '${from.feature}' }],
                ['feature-server', { feature: '${from.feature}' }],
              ],
            },
            {
              from: ['presentation'],
              allow: [
                ['presentation', { feature: '${from.feature}' }],
                ['application', { feature: '${from.feature}' }],
                ['domain', { feature: '${from.feature}' }],
                'shared',
              ],
            },
            {
              from: ['application'],
              allow: [
                ['application', { feature: '${from.feature}' }],
                ['infrastructure', { feature: '${from.feature}' }],
                ['domain', { feature: '${from.feature}' }],
                'shared',
              ],
            },
            {
              from: ['infrastructure'],
              allow: [
                ['infrastructure', { feature: '${from.feature}' }],
                ['domain', { feature: '${from.feature}' }],
                'shared',
              ],
            },
            {
              from: ['feature-server'],
              allow: [
                ['feature-server', { feature: '${from.feature}' }],
                ['domain', { feature: '${from.feature}' }],
                'shared',
              ],
            },
            // `domain` es la capa sin dependencias: solo utilidades puras.
            { from: ['domain'], allow: [['domain', { feature: '${from.feature}' }], 'shared'] },
            { from: ['shared'], allow: ['shared'] },
          ],
        },
      ],
    },
  },
];

export default configuracion;
