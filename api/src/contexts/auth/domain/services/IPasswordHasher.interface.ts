export const PASSWORD_HASHER = 'IPasswordHasher';

/** Checks a typed password against the stored hash. Never throws on a malformed hash: it just does not match. */
export interface IPasswordHasher {
  verify(password: string, storedHash: string): boolean;
}
