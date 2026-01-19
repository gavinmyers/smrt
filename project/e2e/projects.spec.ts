import { expect, test } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and delete a project', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;

    // Create project
    await page.getByLabel('Project Name').fill(projectName);
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify project exists in list
    await expect(page.getByText(projectName)).toBeVisible();

    // Delete project
    const listItem = page.locator('li', { hasText: projectName });
    await listItem.getByRole('button', { name: 'delete' }).click();

    // Verify project is removed
    await expect(page.getByText(projectName)).not.toBeVisible();
  });
});
