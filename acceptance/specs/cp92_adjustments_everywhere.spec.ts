import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the discount-everywhere rule). Everywhere money owed is shown now reflects every
// discount AND every surcharge, not only the percentage discount. An updated copy of the
// discount-everywhere spec ships in the sibling override folder. Here 200 less a 10% discount (20)
// plus a 30 surcharge = 210 owed.
test.describe('adjustments everywhere', () => {
  test('outstanding reflects discounts and surcharges', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', discountPct: 10, surcharge: 30, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$210.00');
  });
});
