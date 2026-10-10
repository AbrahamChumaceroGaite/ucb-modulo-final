import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { APP_CONFIG, LoggerService, type AppConfig } from '@libs/infrastructure';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = await app.resolve(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  const config = app.get<AppConfig>(APP_CONFIG);
  configureApp(app, config);

  await app.listen(config.port, config.host);
  logger.log(`API listening on ${config.host}:${config.port}/${config.prefix}`);
}

bootstrap().catch((error: unknown) => {
  console.error('No se pudo iniciar la API:', error instanceof Error ? error.message : error);
  process.exit(1);
});
