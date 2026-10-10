import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

/** Liveness check. */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  status(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
