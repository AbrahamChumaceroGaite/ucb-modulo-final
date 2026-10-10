import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

/** Liveness check. Whether the model loaded is answered by `GET /risk-model`. */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  status(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
