import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';
import { APP_CONFIG, readConfig } from './infrastructure/config/app-config';
import { PG_POOL, PostgresLifecycle, postgresPoolProvider } from './infrastructure/database/postgres';
import { HealthController } from './infrastructure/monitoring/health.controller';
import { LoggerService } from './infrastructure/monitoring/logger.service';

/**
 * Cross-cutting pieces, registered once: configuration, database pool,
 * logger and the global guard. Every context imports it.
 */
@Global()
@Module({
  controllers: [HealthController],
  providers: [
    { provide: APP_CONFIG, useFactory: () => readConfig() },
    postgresPoolProvider,
    PostgresLifecycle,
    LoggerService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [APP_CONFIG, PG_POOL, LoggerService],
})
export class CoreModule {}
