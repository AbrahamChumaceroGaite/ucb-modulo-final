import { TEST_HASH, TEST_PASSWORD } from '../../testing/fake-users';
import { Pbkdf2PasswordHasher } from './pbkdf2-password-hasher';

const hasher = new Pbkdf2PasswordHasher();

describe('Pbkdf2PasswordHasher', () => {
  it('verifies a hash computed by another implementation', () => {
    expect(hasher.verify(TEST_PASSWORD, TEST_HASH)).toBe(true);
  });

  it('rejects a wrong password, including one off by case', () => {
    expect(hasher.verify('molienda-fina-2025', TEST_HASH)).toBe(false);
    expect(hasher.verify(TEST_PASSWORD.toUpperCase(), TEST_HASH)).toBe(false);
  });

  it('reads the iteration count from the hash', () => {
    expect(hasher.verify(TEST_PASSWORD, TEST_HASH.replace('$1000$', '$1001$'))).toBe(false);
  });

  it.each([
    ['an empty string', ''],
    ['another scheme', TEST_HASH.replace('pbkdf2', 'bcrypt')],
    ['an extra segment', `${TEST_HASH}$x`],
    ['zero iterations', TEST_HASH.replace('$1000$', '$0$')],
    ['an empty salt', 'pbkdf2$1000$$7XuzyYQBvEGlejF5hujD+fcdvjQB2t+YDQhgsW4wMlQ='],
  ])('treats %s as "no match" instead of throwing', (_case, stored) => {
    expect(hasher.verify(TEST_PASSWORD, stored)).toBe(false);
  });
});
