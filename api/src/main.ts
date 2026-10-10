import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { CONFIGURACION, LoggerService, type Configuracion } from '@libs';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = await app.resolve(LoggerService);
  logger.setContext('Arranque');
  app.useLogger(logger);

  const configuracion = app.get<Configuracion>(CONFIGURACION);
  configurarApp(app, configuracion);

  await app.listen(configuracion.puerto, configuracion.host);
  logger.log(`Servicio de predicción escuchando en ${configuracion.host}:${configuracion.puerto}/${configuracion.prefijo}`);
}

bootstrap().catch((error: unknown) => {
  // Without the model or the secret the service must not pretend to work.
  console.error('No se pudo iniciar el servicio de predicción:', error instanceof Error ? error.message : error);
  process.exit(1);
});
