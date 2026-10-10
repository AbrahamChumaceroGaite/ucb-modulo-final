import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { DomainException } from '../../domain/domain.exception';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { IS_PUBLIC } from './public.decorator';
import { TOKEN_ALGORITHM, type TokenClaims } from './token-claims';

/**
 * Global guard: every route needs a valid access token unless it is marked
 * `@Public()`.
 *
 * The web never calls this API from the browser. Its BFF keeps the tokens in
 * httpOnly cookies and forwards `Authorization: Bearer`. Checking here anyway
 * means the API is not open to whoever can reach its port.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw DomainException.unauthorized('Falta el token de acceso.');
    }

    try {
      const claims = verify(token, this.config.jwtSecret, {
        algorithms: [TOKEN_ALGORITHM],
        issuer: this.config.jwtIssuer,
      });
      if (!isAccessToken(claims)) throw new Error('wrong token type');
    } catch {
      // No hint about which check failed.
      throw DomainException.unauthorized('El token no es válido o ha expirado.');
    }
    return true;
  }
}

/** A refresh token must not open the API: only `type: "access"` with a subject. */
function isAccessToken(claims: unknown): claims is TokenClaims {
  if (typeof claims !== 'object' || claims === null) return false;
  const { type, sub } = claims as Record<string, unknown>;
  return type === 'access' && typeof sub === 'string' && sub.length > 0;
}
