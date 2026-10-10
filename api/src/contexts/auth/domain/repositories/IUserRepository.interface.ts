import type { UserAccount } from '../entities/user-account.entity';

export const USER_REPOSITORY = 'IUserRepository';

/** Active accounts only: a deleted user, person or role cannot sign in. */
export interface IUserRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
}
