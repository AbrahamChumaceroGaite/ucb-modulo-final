import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

/** Liveness check, public. The model check is in `GET /modelo-riesgo`. */
@Controller('salud')
export class SaludController {
  @Public()
  @Get()
  estado(): { estado: 'ok' } {
    return { estado: 'ok' };
  }
}
