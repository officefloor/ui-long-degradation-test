import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the sales-tax rule). The tax is now worked out from only the TAXABLE line
// amounts; tax-free lines are excluded from the tax base. The invoice total is subtotal (all
// lines) minus discount plus tax (taxable base times the rate). invoice-taxable-base reports what
// the tax was charged on. This checkpoint ships an updated sales-tax spec in its sibling override
// folder, reflecting the revised rule.
test.describe('tax from taxable lines only', () => {
  test('excludes tax-free lines from the tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', taxPct: 20,
        lineItems: [
          { id: 1, description: 'Design', qty: 1, unitPrice: 200 },
          { id: 2, description: 'Government fee', qty: 1, unitPrice: 100, taxExempt: true },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // subtotal is every line; tax is 20% of the 200 taxable only (not of 300).
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$300.00');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$340.00');
  });
});
