import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A complete invoice view shows every figure at once: lines, discount, tax, levy, retention, the
// total and what is still due. Here: subtotal 300, fixed discount 50, taxable base 250, tax 20%
// = 50, levy 10% = 25, total = 300 - 50 + 50 + 25 = 325; retention 20% of the total = 65, so the
// outstanding figure is 325 - 65 = 260.
test.describe('invoice full view', () => {
  test('shows every figure together', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', discountAmount: 50, taxPct: 20, levyPct: 10, retentionPct: 20,
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
    await expect(page.getByTestId('invoice-tax-levy')).toHaveText('$25.00');
    await expect(page.getByTestId('invoice-retention')).toHaveText('$65.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$325.00');
    await expect(page.getByTestId('invoice-outstanding')).toHaveText('$260.00');
  });
});
