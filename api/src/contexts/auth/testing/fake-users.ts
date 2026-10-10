import type { UserAccount } from '../domain/entities/user-account.entity';
import type { IUserRepository } from '../domain/repositories/IUserRepository.interface';

/**
 * PBKDF2-SHA256 of "molienda-fina-2026", 1000 iterations, salt 0x00..0x0f.
 * Computed with Python's `hashlib.pbkdf2_hmac`, an implementation independent
 * of the one under test. Not a real account's password.
 */
export const TEST_PASSWORD = 'molienda-fina-2026';
export const TEST_HASH = 'pbkdf2$1000$AAECAwQFBgcICQoLDA0ODw==$7XuzyYQBvEGlejF5hujD+fcdvjQB2t+YDQhgsW4wMlQ=';

export const BARISTA: UserAccount = {
  id: '6f1c2a5e-3b7d-4c1e-9a2f-0d4b8e6c1a37',
  email: 'barista@kaffehaus.test',
  fullName: 'Ana Quispe',
  roleId: '2b9e4f10-7c3a-4d5b-8e6f-1a2b3c4d5e6f',
  roleName: 'Barista',
  passwordHash: TEST_HASH,
};

export class FakeUserRepository implements IUserRepository {
  constructor(private readonly users: UserAccount[] = [BARISTA]) {}

  async findByEmail(email: string): Promise<UserAccount | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }
}
