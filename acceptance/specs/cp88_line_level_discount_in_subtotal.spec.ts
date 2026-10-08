import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the line-items rule and the invoice-discount rule). A line's own discount is
// already taken off before the invoice subtotal, so the invoice discount and tax work on the netted
// subtotal. Updated copies of the line-items and discount specs ship in the sibling override
// folder. Here a 200 line at 10% line discount nets to 180, which is the subtotal.
test.describe('line discount nets into the subtotal', () => {
  test('subtotal already reflects line discounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200, discountPct: 10 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$180.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$180.00');
  });
});
