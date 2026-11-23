import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run against the real dev stack (Nest API + Vite dev server),
 * not Docker Compose - faster iteration, and CORS_ORIGIN already defaults
 * to the Vite dev port (see apps/api/src/config.ts), so no extra env is
 * needed locally. Playwright starts both servers itself and tears them
 * down after the run.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:dev --workspace=apps/api',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: '..',
    },
    {
      command: 'npm run dev --workspace=apps/web',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: '..',
    },
  ],
});
