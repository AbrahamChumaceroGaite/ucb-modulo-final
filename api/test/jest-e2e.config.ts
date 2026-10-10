import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  moduleNameMapper: { '^@libs/(.*)$': '<rootDir>/src/libs/$1' },
  setupFiles: ['reflect-metadata'],
  testEnvironment: 'node',
};

export default config;
