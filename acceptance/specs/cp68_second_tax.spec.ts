import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the sales-tax rule). A second tax (a levy) can sit on top of the sales tax.
// Both are worked out on the taxable base and both are added to the total. The levy shows as its
// own line (invoice-tax-levy); the primary tax stays invoice-tax. Ships an updated sales-tax spec
// in its sibling override folder that carries the taxable-lines rule forward and adds the levy.
test.describe('second tax (levy)', () => {
  test('adds a levy on top of the sales tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, levyPct: 5,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');       // 20% of 200
    await expect(page.getByTestId('invoice-tax-levy')).toHaveText('$10.00');  // 5% of 200
    await expect(page.getByTestId('invoice-amount')).toHaveText('$250.00');   // 200 + 40 + 10
  });
});
