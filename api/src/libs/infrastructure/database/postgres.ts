import { Inject, Injectable, type OnApplicationShutdown, type Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

export const PG_POOL = Symbol('PG_POOL');

/**
 * One connection pool for the whole API. `pg` opens connections lazily, so
 * creating the pool does not touch the database: a wrong URL shows up on the
 * first query with PostgreSQL's own message.
 */
export const postgresPoolProvider: Provider = {
  provide: PG_POOL,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig) => new Pool({ connectionString: config.databaseUrl, max: 5 }),
};

/** Closes the pool on shutdown so `npm start` exits instead of hanging on open sockets. */
@Injectable()
export class PostgresLifecycle implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
