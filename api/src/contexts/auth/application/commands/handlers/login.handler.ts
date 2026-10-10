import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '@libs/domain';
import { LoggerService } from '@libs/infrastructure/monitoring/logger.service';
import { USER_REPOSITORY, type IUserRepository } from '../../../domain/repositories/IUserRepository.interface';
import { PASSWORD_HASHER, type IPasswordHasher } from '../../../domain/services/IPasswordHasher.interface';
import { TOKEN_SERVICE, type ITokenService } from '../../../domain/services/ITokenService.interface';
import type { SessionResponse } from '../../types/session.types';
import { LoginCommand } from '../login.command';

/** Hashed when the email does not exist, so both failures take the same time. */
const DECOY_HASH = 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: ITokenService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(LoginHandler.name);
  }

  async execute({ dto }: LoginCommand): Promise<SessionResponse | DomainException> {
    const user = await this.users.findByEmail(dto.email);
    const matches = this.hasher.verify(dto.password, user?.passwordHash ?? DECOY_HASH);

    if (!user || !matches) {
      return DomainException.unauthorized('Correo o contraseña incorrectos.');
    }

    this.logger.logEvent('Sign in', { userId: user.id, role: user.roleName });
    return {
      user: { id: user.id, fullName: user.fullName, roleId: user.roleId, roleName: user.roleName },
      ...this.tokens.issue(user),
    };
  }
}
