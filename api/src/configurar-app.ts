import { ValidationPipe, type INestApplication, type ValidationError } from '@nestjs/common';
import { DomainException, HttpExceptionFilter, type Configuracion } from '@libs';

/**
 * Everything `main.ts` sets on the app, in one place, so the end-to-end tests
 * boot exactly the same app and not a look-alike.
 */
export function configurarApp(app: INestApplication, configuracion: Configuracion): void {
  app.setGlobalPrefix(configuracion.prefijo);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errores) => DomainException.badRequest(primerMensaje(errores)),
    }),
  );
  app.enableCors({ origin: configuracion.origenCors, credentials: false });
}

/**
 * The first broken rule, in Spanish. The web shows one line per error, and
 * class-validator's default for unknown fields is English
 * ("property x should not exist").
 */
function primerMensaje(errores: ValidationError[]): string {
  const [error] = errores;
  if (!error) return 'La solicitud no es válida.';
  if (error.children?.length) return primerMensaje(error.children);
  const restricciones = error.constraints ?? {};
  if (restricciones.whitelistValidation) return `El campo «${error.property}» no se reconoce.`;
  return Object.values(restricciones)[0] ?? `El campo «${error.property}» no es válido.`;
}
