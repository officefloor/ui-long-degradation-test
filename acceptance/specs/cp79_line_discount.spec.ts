import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A single charge line can carry its own discount; that line's amount is shown after its discount.
test.describe('line discount', () => {
  test('shows a line amount after its own discount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200, discountPct: 25 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // 200 less 25% = 150
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$150.00');
  });
});
