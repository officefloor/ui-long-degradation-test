import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the discount rule and the discount-everywhere rule). An invoice discount may be
// either a percentage or a flat amount; either way it comes off before tax and is shown clearly.
// Updated copies of the discount specs ship in the sibling override folder.
test.describe('percentage or fixed discount', () => {
  test('a fixed-amount discount comes off before tax', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountAmount: 50, taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$150.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$30.00'); // 20% of 150
    await expect(page.getByTestId('invoice-amount')).toHaveText('$180.00'); // 200 - 50 + 30
  });
});
