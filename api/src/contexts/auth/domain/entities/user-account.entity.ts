/**
 * An account that can sign in, as the cafeteria database stores it: the
 * `usuario` row with its person's name and its role. Read-only here; this
 * API does not create or edit accounts.
 */
export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  passwordHash: string;
}
