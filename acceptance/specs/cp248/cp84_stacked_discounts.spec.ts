import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED stacked-discount spec after stacking was reversed: an invoice carries at most one
// discount, so there is never a second discount row. 10% of 200 = 20 off, total 180.
test.describe('stacked discounts', () => {
  test('carries a single discount with no second row', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$180.00');
    await expect(page.getByTestId('discount-row-2')).toHaveCount(0);
  });
});
