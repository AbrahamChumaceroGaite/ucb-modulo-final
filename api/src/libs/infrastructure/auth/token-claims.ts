/** Claims signed by the auth context and checked by the global guard. */
export const TOKEN_ALGORITHM = 'HS256';

export type TokenType = 'access' | 'refresh';

export interface TokenClaims {
  sub: string;
  type: TokenType;
  role: string;
}
