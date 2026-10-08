import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a job can be closed, after which no new invoice can be raised on it.
test.describe('close job', () => {
  test('a closed job cannot take a new invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('project-close').click();

    await expect(page.getByTestId('project-status')).toHaveText('CLOSED');
    await expect(page.getByTestId('invoice-new')).toBeDisabled();
  });
});
