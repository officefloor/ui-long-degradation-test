import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Second entity + a cross-entity join in the UI: a project belongs to an owner, and the projects
// list shows the owner's NAME (not id). project-form-owner is a select whose option values are owner ids.
test.describe('projects', () => {
  test('lists projects with their owner name', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      owners: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', ownerId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    await expect(page.getByTestId('projects-table')).toBeVisible();
    await expect(page.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(page.getByTestId('project-row-1').getByTestId('project-owner')).toHaveText('Acme Ltd');
  });

  test('creates a project for an owner', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      owners: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    await page.getByTestId('project-form-name').fill('Mobile App');
    await page.getByTestId('project-form-owner').selectOption('1'); // option value = owner id
    await page.getByTestId('project-form-submit').click();

    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^project-row-/).first();
    await expect(row.getByTestId('project-name')).toHaveText('Mobile App');
    await expect(row.getByTestId('project-owner')).toHaveText('Acme Ltd');
  });
});
