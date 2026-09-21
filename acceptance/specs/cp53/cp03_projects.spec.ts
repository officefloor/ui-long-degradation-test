import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (jobs now carry a unique code): creating a job supplies its code. The list still excludes
// archived jobs (from the archive change). data-testid values are unchanged (stable).
test.describe('projects', () => {
  test('lists projects with their client name, excluding archived', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1, code: 'ACME01' },
        { id: 2, name: 'Old Site', clientId: 1, code: 'ACME02', archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    await expect(page.getByTestId('projects-table')).toBeVisible();
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    await expect(page.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(page.getByTestId('project-row-1').getByTestId('project-client')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('project-row-2')).toHaveCount(0);
  });

  test('creates a project for a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    await page.getByTestId('project-form-name').fill('Mobile App');
    await page.getByTestId('project-form-client').selectOption('1');
    await page.getByTestId('project-form-code').fill('MOB01');
    await page.getByTestId('project-form-submit').click();

    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^project-row-/).first();
    await expect(row.getByTestId('project-name')).toHaveText('Mobile App');
    await expect(row.getByTestId('project-client')).toHaveText('Acme Ltd');
    await expect(row.getByTestId('project-code')).toHaveText('MOB01');
  });
});
