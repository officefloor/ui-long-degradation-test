import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp60 (mutates 40): large amounts still show thousands separators, now in the client's
// currency, like €1,234.50.
test.describe('thousands separators', () => {
  test('shows commas in large amounts in the client currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1234.5 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('€1,234.50');
  });
});
