import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Releasing a retention makes it due: once released, the held amount is added back to what the
// client owes.
test.describe('release retention', () => {
  test('released retention becomes due', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', retentionPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-due-amount')).toHaveText('$900.00');
    await page.getByTestId('invoice-retention-release').click();
    await expect(page.getByTestId('invoice-due-amount')).toHaveText('$1,000.00');
    await expect(page.getByTestId('invoice-retention')).toHaveText('$0.00');
  });
});
