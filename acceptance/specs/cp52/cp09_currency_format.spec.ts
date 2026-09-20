import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (thousands separators): amounts and totals show commas, like $1,234.50.
test.describe('currency formatting', () => {
  test('invoice amounts and totals show commas', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 1234.5 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,234.50');
    await expect(page.getByTestId('job-invoices-total')).toHaveText('$2,234.50');
  });
});
