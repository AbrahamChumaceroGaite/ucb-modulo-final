import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests on the production build, against the real API and the
 * restored database (`docker compose up -d` in the project root first).
 * Both servers are reused when they are already running.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3408',
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm start',
      cwd: '../api',
      url: 'http://localhost:8082/api/v1/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run build && npm start',
      url: 'http://localhost:3408',
      reuseExistingServer: true,
      timeout: 240_000,
    },
  ],
});
