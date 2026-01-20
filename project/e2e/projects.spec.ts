import { expect, test } from '@playwright/test';

test.describe('Project Deep Navigation', () => {
  test.beforeEach(async ({ page, request }) => {
    // Ensure we have a user and are logged in for every test
    const email = `proj-${Date.now()}-${Math.random()}@test.com`;
    const password = 'password123';
    
    // 1. Register (global request is fine for registration)
    await request.post('/api/open/user/register', {
      data: { email, password, name: 'E2E User' }
    });

    // 2. Login via PAGE request to establish session cookies in the browser context
    await page.request.post('/api/open/user/login', {
      data: { email, password }
    });
    
    // 3. Go to main page (should now bypass AuthView because cookies are set)
    await page.goto('/');
    await expect(page.getByTestId('nav-projects')).toBeVisible();
  });

  test('should manage conditions and features within a project', async ({ page }) => {
    const projectName = `Deep Test Project ${Date.now()}`;
    const conditionName = `Test Condition ${Date.now()}`;
    const featureName = `Test Feature ${Date.now()}`;

    // 1. Create project
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter name...').fill(projectName);
    await page.keyboard.press('Enter');

    // 2. Navigate into project
    await page.getByText(projectName).first().click();
    await expect(page.getByRole('tab', { name: 'Info' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(projectName).last()).toBeVisible();

    // 3. Manage Conditions
    await page.getByRole('tab', { name: 'Conditions' }).click();
    await expect(page.getByRole('tab', { name: 'Conditions' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(500);
    // Find the container that has the "Conditions" title and then find the add button within it
    await page.locator('div').filter({ has: page.getByTestId('list-title').filter({ hasText: /^Conditions$/ }) })
        .getByTestId('add-button').click();
    await page.getByPlaceholder('Enter name...').fill(conditionName);
    await page.keyboard.press('Enter');
    await expect(page.getByText(conditionName)).toBeVisible();

    // 4. Manage Features
    await page.getByRole('tab', { name: 'Features' }).click();
    await expect(page.getByRole('tab', { name: 'Features' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(500);
    // Find the container that has the "Features" title and then find the add button within it
    await page.locator('div').filter({ has: page.getByTestId('list-title').filter({ hasText: /^Features$/ }) })
        .getByTestId('add-button').click();
    await page.getByPlaceholder('Enter name...').fill(featureName);
    await page.keyboard.press('Enter');
    await expect(page.getByText(featureName)).toBeVisible();

    // 10. Manage Keys
    await page.getByRole('tab', { name: 'Keys' }).click();
    await expect(page.getByRole('tab', { name: 'Keys' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForTimeout(500);
    await page.locator('div').filter({ has: page.getByTestId('list-title').filter({ hasText: /^Keys$/ }) })
        .getByTestId('add-button').click();
    await page.getByPlaceholder('Enter name...').fill('My API Key');
    await page.keyboard.press('Enter');
    
    // Check for the "display once" modal
    await expect(page.getByText('Project API Key Generated')).toBeVisible();
    await expect(page.getByText('Important: Store this JSON')).toBeVisible();
    await page.getByRole('button', { name: 'I have saved it' }).click();
    await expect(page.getByText('My API Key')).toBeVisible();

    // 11. Navigate back via Breadcrumb
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page.getByText('Project Inventory')).toBeVisible();
  });
});
