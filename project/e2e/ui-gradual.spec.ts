import { test, expect } from '@playwright/test';

test.describe('UI Gradual Integration', () => {
  const baseURL = `http://localhost:${process.env.VITE_PORT || '4173'}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Level 6: UI Only - Static HTML Sentinel', async ({ page }) => {
    // Should see Login page if not logged in
    await expect(page.getByText('Login to SMRT')).toBeVisible();
  });

  test('Level 7: UI -> API - System Sentinel', async ({ page, request }) => {
    const user = { email: `ui7-${Date.now()}@test.com`, password: 'pw' };
    await request.post(`/api/open/user/register`, { data: { ...user, name: 'UI User' } });
    await page.request.post(`/api/open/user/login`, { data: user });

    await page.goto('/system');
    const apiSentinel = page.locator('#diag-api');
    await expect(apiSentinel).toBeAttached();
    await expect(apiSentinel).toHaveText('SMRT-V1-READY', { timeout: 10000 });
  });

  test('Level 8: UI -> API -> DB - Database Sentinel', async ({ page, request }) => {
    const user = { email: `ui8-${Date.now()}@test.com`, password: 'pw' };
    await request.post(`/api/open/user/register`, { data: { ...user, name: 'UI User' } });
    await page.request.post(`/api/open/user/login`, { data: user });

    await page.goto('/system');
    const dbSentinel = page.locator('#diag-db');
    await expect(dbSentinel).toBeAttached();
    await expect(dbSentinel).toHaveText('SMRT-V1-READY', { timeout: 10000 });
  });

  test('Level 9: Full Stack - Project Inventory', async ({ page, request }) => {
    // 1. Create and Login
    const user = { email: `ui9-${Date.now()}@test.com`, password: 'pw' };
    await request.post(`/api/open/user/register`, { data: { ...user, name: 'UI User' } });
    await page.request.post(`/api/open/user/login`, { data: user });

    await page.goto('/projects');
    // Verifies UI -> Proxy -> API -> DB
    await expect(page.getByText('Project Inventory')).toBeVisible();
    
    // Check that we aren't seeing an error alert
    const errorAlert = page.locator('.MuiAlert-message');
    await expect(errorAlert).not.toBeVisible();
  });
});
