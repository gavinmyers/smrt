import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  const email = `smoke-${Date.now()}@test.com`;
  const password = 'pw';
  await page.request.post('/api/open/user/register', {
    data: { email, password, name: 'Smoke User' },
  });
  await page.request.post('/api/open/user/login', {
    data: { email, password },
  });

  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Vite \+ React/);
  await expect(page.getByText('SMRT Admin')).toBeVisible();
});
