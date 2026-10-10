/** A `usuario` row with its person's name and role. This API only reads accounts. */
export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  passwordHash: string;
}
