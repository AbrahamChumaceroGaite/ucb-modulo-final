/**
 * The claims both sides agree on: the auth context signs tokens with them and
 * the global guard checks them. One definition, so a renamed claim cannot
 * leave every request rejected with no hint why.
 */
export const TOKEN_ALGORITHM = 'HS256';

export type TokenType = 'access' | 'refresh';

export interface TokenClaims {
  sub: string;
  type: TokenType;
  role: string;
}
