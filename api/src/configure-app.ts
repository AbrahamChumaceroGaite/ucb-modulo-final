import { ValidationPipe, type INestApplication, type ValidationError } from '@nestjs/common';
import { DomainException } from '@libs/domain';
import { HttpExceptionFilter, type AppConfig } from '@libs/infrastructure';

/** Global prefix, error filter, validation and CORS. Shared by `main.ts` and the HTTP tests. */
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

/** A type error is reported before other rules on the same field ("abc" is not a number, not a negative one). */
const TYPE_CONSTRAINTS = ['isNumber', 'isInt', 'isString'];

/** First broken rule as one Spanish message; class-validator's English unknown-field message is replaced. */
function firstMessage(errors: ValidationError[]): string {
  const [error] = errors;
  if (!error) return 'La solicitud no es válida.';
  if (error.children?.length) return firstMessage(error.children);
  const constraints = error.constraints ?? {};
  if (constraints.whitelistValidation) return `El campo «${error.property}» no se reconoce.`;
  const typeError = TYPE_CONSTRAINTS.map((key) => constraints[key]).find(Boolean);
  return typeError ?? Object.values(constraints)[0] ?? `El campo «${error.property}» no es válido.`;
}
