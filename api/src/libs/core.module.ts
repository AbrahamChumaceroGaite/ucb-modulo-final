import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './src/infrastructure/auth/jwt-auth.guard';
import { CONFIGURACION, leerConfiguracion } from './src/infrastructure/config/configuracion';
import { LoggerService } from './src/infrastructure/monitoring/logger.service';
import { SaludController } from './src/infrastructure/monitoring/salud.controller';

/**
 * Cross-cutting pieces, registered once: configuration, logger and the global
 * guard. Every context imports it, as in the SMC.
 */
@Global()
@Module({
  controllers: [SaludController],
  providers: [
    { provide: CONFIGURACION, useFactory: () => leerConfiguracion() },
    LoggerService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [CONFIGURACION, LoggerService],
})
export class CoreModule {}
