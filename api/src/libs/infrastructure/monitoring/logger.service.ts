import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

/** Logger with a per-class context (one instance per consumer). */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor() {
    super();
    // Silent under Jest.
    if (process.env.NODE_ENV === 'test') this.setLogLevels([]);
  }

  logEvent(event: string, data: Record<string, unknown>): void {
    this.log(`${event} ${JSON.stringify(data)}`);
  }
}
