import { Inject, Injectable, type OnApplicationShutdown, type Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

export const PG_POOL = Symbol('PG_POOL');

/** One PostgreSQL pool for the API; connections open on the first query. */
export const postgresPoolProvider: Provider = {
  provide: PG_POOL,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig) => new Pool({ connectionString: config.databaseUrl, max: 5 }),
};

/** Closes the pool on shutdown. */
@Injectable()
export class PostgresLifecycle implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
