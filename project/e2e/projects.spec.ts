import { expect, test } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create, edit, and delete a project', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;
    const updatedName = `${projectName} Updated`;

    // 1. Create project
    await page.getByRole('button', { name: 'Add Project' }).click();
    await page.getByPlaceholder('Enter project name...').fill(projectName);
    await page.keyboard.press('Enter');

    // Verify project exists in list
    await expect(page.getByText(projectName)).toBeVisible();

    // 2. Edit project
    const listItem = page.locator('li', { hasText: projectName });
    await listItem.getByLabel('edit').click();
    await page.getByPlaceholder('Enter project name...').fill(updatedName);
    await page.getByLabel('save').click();

    // Verify updated name exists
    await expect(page.getByText(updatedName)).toBeVisible();

    // 3. Delete project
    const updatedListItem = page.locator('li', { hasText: updatedName });
    await updatedListItem.getByLabel('delete').click();

    // Verify project is removed
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});