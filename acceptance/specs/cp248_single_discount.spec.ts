import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE REVERSAL: only one discount per invoice is allowed again. Stacked discounts collapse to
// a single discount, and the affordance to add another discount is gone. A single 10% discount on
// 200 shows $20.00 off for a total of $180.00, with no add-another control.
test.describe('single discount only', () => {
  test('one discount, no way to add another', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$180.00');
    await expect(page.getByTestId('discount-add')).toHaveCount(0);
  });
});
