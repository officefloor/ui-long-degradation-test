import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (projects can be archived): the projects list excludes archived projects by default, and
// still lists ALL the active ones, each with its client's name.
test.describe('projects', () => {
  test('lists projects with their client name, excluding archived', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Old Site', clientId: 1, archived: true },
        { id: 3, name: 'Mobile App', clientId: 1 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    await expect(page.getByTestId('projects-table')).toBeVisible();
    // ALL the active projects, not just the first — a list that silently truncates looks identical
    // on a single-row fixture.
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(2);
    await expect(page.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(page.getByTestId('project-row-1').getByTestId('project-client')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('project-row-3').getByTestId('project-name')).toHaveText('Mobile App');
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
    await page.getByTestId('project-form-submit').click();

    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^project-row-/).first();
    await expect(row.getByTestId('project-name')).toHaveText('Mobile App');
    await expect(row.getByTestId('project-client')).toHaveText('Acme Ltd');
  });
});
