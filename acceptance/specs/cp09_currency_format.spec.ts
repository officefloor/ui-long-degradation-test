import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Money is now displayed with a currency symbol ("$100.00"). The audit record format is unchanged.
// This is a UI-display change only (the paid-invoice audit still asserts amount=100.00).
test.describe('currency formatting', () => {
  test('invoice amounts and totals show a currency symbol', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'UNPAID' },
        { id: 2, projectId: 1, amount: 50, status: 'UNPAID' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('project-invoices-total')).toHaveText('$150.00');
  });
});
