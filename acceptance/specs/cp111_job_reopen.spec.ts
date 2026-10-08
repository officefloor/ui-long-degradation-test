import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a closed job can be reopened so invoices can be raised on it again.
test.describe('reopen job', () => {
  test('reopening a closed job makes it active again', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, closed: true }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('project-status')).toHaveText('CLOSED');

    await page.getByTestId('project-reopen').click();
    await expect(page.getByTestId('project-status')).toHaveText('ACTIVE');
    await expect(page.getByTestId('invoice-new')).toBeEnabled();
  });
});
