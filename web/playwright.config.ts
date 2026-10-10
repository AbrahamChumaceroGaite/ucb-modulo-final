import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests on the production build, against the real API and the
 * restored database. The API (branch `api_kaffe`) must already be running;
 * the web is built and started here unless it is already up.
 */
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3408',
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3408',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
