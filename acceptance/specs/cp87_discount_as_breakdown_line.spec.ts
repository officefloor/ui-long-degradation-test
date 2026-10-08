import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each discount appears as its own negative line in the invoice breakdown so the arithmetic is
// explicit.
test.describe('discount breakdown line', () => {
  test('shows a discount as a negative breakdown line', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        discounts: [{ id: 1, amount: 30 }],
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('breakdown-discount-row-1')).toHaveText('-$30.00');
  });
});
