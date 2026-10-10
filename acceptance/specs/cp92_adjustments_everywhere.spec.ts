import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Everywhere money owed is shown now reflects every discount AND every surcharge, not only the
// percentage discount. Here 200 less a 10% discount (20) plus a 30 surcharge = 210 owed. The
// client's statement also shows the total of all discounts and the total of all surcharges, so the
// amount owed can be traced.
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

  test('the statement totals every discount and every surcharge', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', discountPct: 10, surcharge: 30, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'SENT', discountAmount: 15, lineItems: [{ id: 2, description: 'Support', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    // Invoice 1: 200 - 20 + 30 = 210. Invoice 2: 100 - 15 = 85. Owed 295.
    // Discounts 20 + 15 = 35; surcharges 30.
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$295.00');
    await expect(page.getByTestId('statement-discounts-total')).toHaveText('$35.00');
    await expect(page.getByTestId('statement-surcharges-total')).toHaveText('$30.00');
  });
});
