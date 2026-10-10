import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED full-view spec after the levy was scrapped: every remaining figure at once, with no levy
// line. Here: subtotal 300, fixed discount 50, taxable base 250, tax 20% = 50, total
// = 300 - 50 + 50 = 300; retention 20% of the total = 60, so the outstanding figure is 300 - 60 = 240.
test.describe('invoice full view', () => {
  test('shows every figure together', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', discountAmount: 50, taxPct: 20, retentionPct: 20,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$300.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$250.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-tax-levy')).toHaveCount(0);
    await expect(page.getByTestId('invoice-retention')).toHaveText('$60.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$300.00');
    await expect(page.getByTestId('invoice-outstanding')).toHaveText('$240.00');
  });
});
