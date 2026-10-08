import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Retained money is shown separately from what the client owes now: the amount due excludes the
// unreleased retention.
test.describe('retention shown separately', () => {
  test('due excludes the unreleased retention', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', retentionPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,000.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$900.00');
  });
});
