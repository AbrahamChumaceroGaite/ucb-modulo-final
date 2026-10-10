export const PASSWORD_HASHER = 'IPasswordHasher';

/** Checks a password against the stored hash; a malformed hash simply does not match. */
export interface IPasswordHasher {
  verify(password: string, storedHash: string): boolean;
}
