import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (sales tax): an invoice amount now includes tax added on top of its line items.
test.describe('invoice line items', () => {
  test('invoice amount includes tax on the line-item total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    // 1000 + 20% tax = 1,200.00
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,200.00');
  });
});
