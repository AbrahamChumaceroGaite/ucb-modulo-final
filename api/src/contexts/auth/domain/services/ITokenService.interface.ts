import type { UserAccount } from '../entities/user-account.entity';

export const TOKEN_SERVICE = 'ITokenService';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  issue(user: UserAccount): SessionTokens;
  accessFor(user: UserAccount): string;
  /** The user id of a valid refresh token, or `null` for anything else (expired, forged, an access token). */
  userIdFromRefresh(refreshToken: string): string | null;
}
