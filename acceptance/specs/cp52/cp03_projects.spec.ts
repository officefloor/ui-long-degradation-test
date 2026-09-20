import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (projects can be archived): the projects list excludes archived projects by default.
test.describe('projects', () => {
  test('lists projects with their client name, excluding archived', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Old Site', clientId: 1, archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();

    await expect(page.getByTestId('jobs-table')).toBeVisible();
    await expect(page.getByTestId(/^job-row-/)).toHaveCount(1);
    await expect(page.getByTestId('job-row-1').getByTestId('job-name')).toHaveText('Website Rebuild');
    await expect(page.getByTestId('job-row-1').getByTestId('job-client')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('job-row-2')).toHaveCount(0);
  });

  test('creates a project for a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();

    await page.getByTestId('job-form-name').fill('Mobile App');
    await page.getByTestId('job-form-client').selectOption('1');
    await page.getByTestId('job-form-submit').click();

    await expect(page.getByTestId(/^job-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^job-row-/).first();
    await expect(row.getByTestId('job-name')).toHaveText('Mobile App');
    await expect(row.getByTestId('job-client')).toHaveText('Acme Ltd');
  });
});
