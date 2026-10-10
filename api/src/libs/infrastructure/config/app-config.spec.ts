import { readConfig } from './app-config';

const env = {
  JWT_SECRET: 'un-secreto-de-desarrollo-de-32-bytes!',
  DATABASE_URL: 'postgres://postgres:clave@localhost:5433/kaffehausdb',
};

describe('readConfig', () => {
  it('fills the defaults the README documents', () => {
    expect(readConfig(env)).toMatchObject({
      port: 8082,
      prefix: 'api/v1',
      jwtIssuer: 'kaffehaus-ml',
      accessTokenMinutes: 15,
      refreshTokenDays: 7,
      corsOrigin: 'http://localhost:3408',
    });
  });

  it('refuses a secret too short for HS256', () => {
    expect(() => readConfig({ ...env, JWT_SECRET: 'corto' })).toThrow('JWT_SECRET');
  });

  it('refuses to start without a PostgreSQL URL', () => {
    expect(() => readConfig({ ...env, DATABASE_URL: undefined })).toThrow('DATABASE_URL');
    expect(() => readConfig({ ...env, DATABASE_URL: 'mysql://localhost/db' })).toThrow('DATABASE_URL');
  });

  it('names the variable that is not a positive integer', () => {
    expect(() => readConfig({ ...env, PORT: '80a' })).toThrow('PORT');
    expect(() => readConfig({ ...env, ACCESS_TOKEN_MINUTES: '0' })).toThrow('ACCESS_TOKEN_MINUTES');
  });
});
