import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A project can be marked active, on hold or finished, shown on its row and set when creating one.
test.describe('project status', () => {
  test('shows a project\'s status', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, status: 'ON_HOLD' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await expect(page.getByTestId('job-row-1').getByTestId('job-status')).toHaveText('ON_HOLD');
  });

  test('sets the status when creating a project', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();

    await page.getByTestId('job-form-name').fill('Mobile App');
    await page.getByTestId('job-form-client').selectOption('1');
    await page.getByTestId('job-form-status').selectOption('ACTIVE');
    await page.getByTestId('job-form-submit').click();

    await expect(page.getByTestId(/^job-row-/).first().getByTestId('job-status')).toHaveText('ACTIVE');
  });
});
