import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The invoice shows how much the client saved — all discounts added together.
test.describe('total savings', () => {
  test('sums the discounts into a savings figure', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('invoice-total-savings')).toHaveText('$40.00');
  });
});
