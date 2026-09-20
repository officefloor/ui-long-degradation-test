import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sales tax is added on top, after any discount. The invoice total is
// (subtotal minus discount) times (1 plus the tax rate).
test.describe('sales tax', () => {
  test('adds tax after the discount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$36.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$216.00');
  });
});
