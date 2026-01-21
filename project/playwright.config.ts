import { defineConfig, devices } from '@playwright/test';

const webPort = process.env.WEB_PORT || process.env.VITE_PORT;
if (!webPort) {
  throw new Error(
    'WEB_PORT or VITE_PORT environment variable is required for E2E tests',
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
