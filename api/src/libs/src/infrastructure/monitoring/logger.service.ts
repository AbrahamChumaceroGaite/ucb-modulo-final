import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

/**
 * Logger with a per-class context, as in the SMC handlers
 * (`this.logger.setContext('...')`). Transient scope so each consumer gets
 * its own instance and contexts do not overwrite each other.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor() {
    super();
    // Tests print their own report; the service's log would bury it.
    if (process.env.NODE_ENV === 'test') this.setLogLevels([]);
  }

  logEvent(evento: string, datos: Record<string, unknown>): void {
    this.log(`${evento} ${JSON.stringify(datos)}`);
  }
}
