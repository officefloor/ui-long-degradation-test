import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED statement spec (carries the discounted-amounts-in-client-currency rule forward). The
// statement still totals discounted amounts, shown in the client's own currency.
test.describe('client statement', () => {
  test('the total owed uses discounted amounts in the client currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'EUR' }],
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
    // 900 (1000 less 10%) + 234.50 = 1,134.50, in euros.
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('€1,134.50');
  });
});
