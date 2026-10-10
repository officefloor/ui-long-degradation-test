import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice discount now flows through everywhere money owed is shown. The home screen's
// outstanding figure uses the discounted amount, and the client's statement shows the total
// discount the client has been given alongside the discounted total owed.
test.describe('discount everywhere', () => {
  test('the outstanding total uses the discounted amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', discountPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveText('$180.00');
  });

  test('the statement shows the total discount given', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', discountPct: 10, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 1000 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 234.5 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    // 900 (1000 less 10%) + 234.50 = 1,134.50 owed; 100 of discount given in total.
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$1,134.50');
    await expect(page.getByTestId('statement-discounts-total')).toHaveText('$100.00');
  });
});
