import { pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IPasswordHasher } from '../../domain/services/IPasswordHasher.interface';

/**
 * Verifies the hashes already stored in `usuario.contrasena`.
 *
 * Format, as the cafeteria's previous backend wrote them:
 * `pbkdf2$<iterations>$<base64 salt>$<base64 hash>`, PBKDF2 with HMAC-SHA256.
 * The key length comes from the stored hash, so a different length still
 * verifies. The comparison is constant-time.
 */
const PREFIX = 'pbkdf2';
const DIGEST = 'sha256';

@Injectable()
export class Pbkdf2PasswordHasher implements IPasswordHasher {
  verify(password: string, storedHash: string): boolean {
    const [prefix, iterationsText, saltText, hashText, ...rest] = storedHash.split('$');
    const iterations = Number(iterationsText);
    if (prefix !== PREFIX || rest.length > 0 || !Number.isInteger(iterations) || iterations <= 0) return false;

    const salt = Buffer.from(saltText ?? '', 'base64');
    const expected = Buffer.from(hashText ?? '', 'base64');
    if (salt.length === 0 || expected.length === 0) return false;

    const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);
    return timingSafeEqual(actual, expected);
  }
}
