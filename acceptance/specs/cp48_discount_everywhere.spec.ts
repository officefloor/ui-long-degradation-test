import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice discount now flows through everywhere money owed is shown. The home screen's
// outstanding figure uses the discounted amount.
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
});
