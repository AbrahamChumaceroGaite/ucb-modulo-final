import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Public } from '@libs/infrastructure';
import { unwrap } from '@libs/presentation';
import { LoginCommand } from '../application/commands/login.command';
import { RefreshSessionCommand } from '../application/commands/refresh-session.command';
import { LoginDto } from '../application/dto/login.dto';
import { RefreshSessionDto } from '../application/dto/refresh-session.dto';
import type { RefreshResponse, SessionResponse } from '../application/types/session.types';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<SessionResponse> {
    return unwrap(await this.commandBus.execute(new LoginCommand(dto)));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshSessionDto): Promise<RefreshResponse> {
    return unwrap(await this.commandBus.execute(new RefreshSessionCommand(dto)));
  }
}
