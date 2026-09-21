import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each job has a short reference code, shown on the job, and it must be unique across jobs.
test.describe('job code', () => {
  test('shows a job code', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, code: 'ACME01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await expect(page.getByTestId('project-row-1').getByTestId('project-code')).toHaveText('ACME01');
  });

  test('rejects a duplicate code', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, code: 'ACME01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-form-name').fill('Second');
    await page.getByTestId('project-form-client').selectOption('1');
    await page.getByTestId('project-form-code').fill('ACME01');
    await page.getByTestId('project-form-submit').click();

    await expect(page.getByTestId('project-form-code-error')).toBeVisible();
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
  });
});
