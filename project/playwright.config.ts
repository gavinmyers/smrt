import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${process.env.VITE_PORT || '4173'}`,
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter api build && pnpm --filter api start',
      url: `http://localhost:${process.env.API_PORT || process.env.PORT || '3001'}/api/open/status/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: process.env.API_PORT || process.env.PORT || '3001',
        DATABASE_URL:
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5434/smrt_test?schema=public',
        DB_HOST: 'localhost',
        DB_PORT: '5434',
      },
      timeout: 120_000,
    },
    {
      command: `pnpm --filter web preview --port ${process.env.VITE_PORT || '4173'} --host 0.0.0.0`,
      url: `http://localhost:${process.env.VITE_PORT || '4173'}`,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: `http://localhost:${process.env.API_PORT || process.env.PORT || '3001'}`,
      },
      timeout: 120_000,
    },
  ],
});
