import { ValidationPipe, type INestApplication, type ValidationError } from '@nestjs/common';
import { DomainException } from '@libs/domain';
import { HttpExceptionFilter, type AppConfig } from '@libs/infrastructure';

/**
 * Everything `main.ts` sets on the app, in one place, so the end-to-end tests
 * boot exactly the same app and not a look-alike.
 */
export function configureApp(app: INestApplication, config: AppConfig): void {
  app.setGlobalPrefix(config.prefix);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => DomainException.badRequest(firstMessage(errors)),
    }),
  );
  app.enableCors({ origin: config.corsOrigin, credentials: false });
  app.enableShutdownHooks();
}

/**
 * A wrong type explains itself better than the rules it also breaks: "mucho"
 * is not a negative number, it is not a number. class-validator reports
 * constraints in decorator order, so the type check is picked explicitly.
 */
const TYPE_CONSTRAINTS = ['isNumber', 'isInt', 'isString'];

/**
 * The first broken rule, in Spanish. The web shows one line per error, and
 * class-validator's message for an unknown field is English
 * ("property x should not exist").
 */
function firstMessage(errors: ValidationError[]): string {
  const [error] = errors;
  if (!error) return 'La solicitud no es válida.';
  if (error.children?.length) return firstMessage(error.children);
  const constraints = error.constraints ?? {};
  if (constraints.whitelistValidation) return `El campo «${error.property}» no se reconoce.`;
  const typeError = TYPE_CONSTRAINTS.map((key) => constraints[key]).find(Boolean);
  return typeError ?? Object.values(constraints)[0] ?? `El campo «${error.property}» no es válido.`;
}
