import type { Config } from 'jest';
import base from './jest-e2e.config';

/** Tests against the restored database. They need `docker compose up -d` and `.env`. */
const config: Config = {
  ...base,
  testRegex: 'test/.*\\.db-spec\\.ts$',
  testTimeout: 60_000,
};

export default config;
