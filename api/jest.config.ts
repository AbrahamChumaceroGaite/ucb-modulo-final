import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
  moduleNameMapper: {
    '^@libs$': '<rootDir>/libs/src/index',
    '^@libs/(.*)$': '<rootDir>/libs/src/$1',
  },
  setupFiles: ['reflect-metadata'],
  testEnvironment: 'node',
};

export default config;
