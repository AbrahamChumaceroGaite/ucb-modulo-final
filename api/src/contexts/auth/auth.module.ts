import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoginHandler } from './application/commands/handlers/login.handler';
import { RefreshSessionHandler } from './application/commands/handlers/refresh-session.handler';
import { USER_REPOSITORY } from './domain/repositories/IUserRepository.interface';
import { PASSWORD_HASHER } from './domain/services/IPasswordHasher.interface';
import { TOKEN_SERVICE } from './domain/services/ITokenService.interface';
import { Pbkdf2PasswordHasher } from './infrastructure/crypto/pbkdf2-password-hasher';
import { UserPostgresRepository } from './infrastructure/persistence/user.postgres.repository';
import { JwtTokenService } from './infrastructure/tokens/jwt-token.service';
import { AuthController } from './presentation/auth.controller';

/** Bounded context: signing in against the accounts in the cafeteria database. */
@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    LoginHandler,
    RefreshSessionHandler,
    { provide: USER_REPOSITORY, useClass: UserPostgresRepository },
    { provide: PASSWORD_HASHER, useClass: Pbkdf2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class AuthModule {}
