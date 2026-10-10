import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { CONFIGURACION, type Configuracion } from '../config/configuracion';
import { ES_PUBLICA } from './public.decorator';

/**
 * Accepts exactly the access tokens Spring issues, and nothing else.
 *
 * Mirrors `JwtService.leerClaims` in kaffehausv4: HMAC signature with the
 * access secret, issuer `kaffehausv4`, and claim `tipo = "acceso"`. jjwt
 * picks HS256/384/512 from the key length, so the three are allowed; the
 * default development secret (60 bytes) produces HS384.
 *
 * The web never calls this service from the browser: its BFF reads the
 * httpOnly cookie and forwards `Authorization: Bearer`, the same as with
 * Spring. Validating here anyway means the service is not open to anyone who
 * can reach its port.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CONFIGURACION) private readonly configuracion: Configuracion,
  ) {}

  canActivate(contexto: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publica) return true;

    const peticion = contexto.switchToHttp().getRequest<Request>();
    const [esquema, token] = (peticion.headers.authorization ?? '').split(' ');
    if (esquema !== 'Bearer' || !token) {
      throw DomainException.unauthorized('Falta el token de acceso.');
    }

    try {
      const claims = verify(token, this.configuracion.jwtSecreto, {
        algorithms: ['HS256', 'HS384', 'HS512'],
        issuer: this.configuracion.jwtEmisor,
      });
      if (typeof claims === 'string' || claims.tipo !== 'acceso' || !claims.sub) {
        throw new Error('tipo de token incorrecto');
      }
    } catch {
      // Same message as Spring (with its accent): no hint about which check failed.
      throw DomainException.unauthorized('El token no es válido o ha expirado');
    }
    return true;
  }
}
