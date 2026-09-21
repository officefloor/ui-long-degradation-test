import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (jobs now carry a unique code): creating a job supplies its code alongside the status.
// data-testid values are unchanged (stable).
test.describe('project status', () => {
  test('shows a project\'s status', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, code: 'ACME01', status: 'ON_HOLD' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await expect(page.getByTestId('project-row-1').getByTestId('project-status')).toHaveText('ON_HOLD');
  });

  test('sets the status when creating a project', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    await page.getByTestId('project-form-name').fill('Mobile App');
    await page.getByTestId('project-form-client').selectOption('1');
    await page.getByTestId('project-form-code').fill('MOB01');
    await page.getByTestId('project-form-status').selectOption('ACTIVE');
    await page.getByTestId('project-form-submit').click();

    await expect(page.getByTestId(/^project-row-/).first().getByTestId('project-status')).toHaveText('ACTIVE');
  });
});
