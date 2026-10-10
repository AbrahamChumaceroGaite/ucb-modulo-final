import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '@libs/domain';
import { USER_REPOSITORY, type IUserRepository } from '../../../domain/repositories/IUserRepository.interface';
import { TOKEN_SERVICE, type ITokenService } from '../../../domain/services/ITokenService.interface';
import type { RefreshResponse } from '../../types/session.types';
import { RefreshSessionCommand } from '../refresh-session.command';

/**
 * A new access token for a valid refresh token.
 *
 * The account is read again: a user deleted after signing in stops getting
 * access tokens at the next refresh, at most 15 minutes later.
 */
@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler implements ICommandHandler<RefreshSessionCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: ITokenService,
  ) {}

  async execute({ dto }: RefreshSessionCommand): Promise<RefreshResponse | DomainException> {
    const userId = this.tokens.userIdFromRefresh(dto.refreshToken);
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) return DomainException.unauthorized('La sesión expiró. Vuelve a entrar.');

    return { accessToken: this.tokens.accessFor(user) };
  }
}
