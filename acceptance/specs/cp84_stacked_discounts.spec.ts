import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the discount rule). An invoice can carry several discounts at once; each is
// shown and their combined effect comes off before tax. An updated copy of the discount spec ships
// in the sibling override folder. Here 10% of 200 (20) plus a flat 20 = 40 combined.
test.describe('stacked discounts', () => {
  test('shows each discount and the combined total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        discounts: [{ id: 1, pct: 10 }, { id: 2, amount: 20 }],
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('discount-row-1').getByTestId('discount-row-amount')).toHaveText('$20.00');
    await expect(page.getByTestId('discount-row-2').getByTestId('discount-row-amount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$160.00');
  });
});
