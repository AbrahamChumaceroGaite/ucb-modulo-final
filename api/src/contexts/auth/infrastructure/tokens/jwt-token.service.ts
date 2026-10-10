import { Inject, Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { APP_CONFIG, TOKEN_ALGORITHM, type AppConfig, type TokenClaims, type TokenType } from '@libs/infrastructure';
import type { UserAccount } from '../../domain/entities/user-account.entity';
import type { ITokenService, SessionTokens } from '../../domain/services/ITokenService.interface';

/**
 * Signs the session tokens with the same claims the global guard checks.
 *
 * Stateless on purpose: there is no session table to keep in step. The cost
 * is that signing out only deletes the cookies; a stolen refresh token stays
 * valid until it expires (7 days by default). That trade-off is written in
 * the README.
 */
@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  issue(user: UserAccount): SessionTokens {
    return {
      accessToken: this.accessFor(user),
      refreshToken: this.sign(user, 'refresh', `${this.config.refreshTokenDays}d`),
    };
  }

  accessFor(user: UserAccount): string {
    return this.sign(user, 'access', `${this.config.accessTokenMinutes}m`);
  }

  userIdFromRefresh(refreshToken: string): string | null {
    try {
      const claims = verify(refreshToken, this.config.jwtSecret, {
        algorithms: [TOKEN_ALGORITHM],
        issuer: this.config.jwtIssuer,
      });
      if (typeof claims !== 'object' || claims.type !== 'refresh' || typeof claims.sub !== 'string') return null;
      return claims.sub;
    } catch {
      return null;
    }
  }

  private sign(user: UserAccount, type: TokenType, expiresIn: `${number}${'m' | 'd'}`): string {
    const claims: Omit<TokenClaims, 'sub'> = { type, role: user.roleName };
    return sign(claims, this.config.jwtSecret, {
      algorithm: TOKEN_ALGORITHM,
      issuer: this.config.jwtIssuer,
      subject: user.id,
      expiresIn,
    });
  }
}
