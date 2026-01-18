import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Vite \+ React/);
});

test('counter increments', async ({ page }) => {
  await page.goto('/');

  // Click the counter button.
  await page.getByRole('button', { name: /count is 0/i }).click();

  // Expects the button to contain "Count is 1".
  await expect(page.getByRole('button', { name: /count is 1/i })).toBeVisible();
});
