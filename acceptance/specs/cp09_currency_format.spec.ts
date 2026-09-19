import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE change: money is now displayed with a currency symbol ("$100.00"). This changes the
// displayed VALUES that cp04 (invoice amounts + project total) and cp08 (outstanding total) assert,
// so those prior specs are shipped updated alongside this one (mutates: [4, 8]). The audit record
// format is unchanged — this is a UI-display change only (cp05 still asserts amount=100.00).
test.describe('currency formatting', () => {
  test('invoice amounts and totals show a currency symbol', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      owners: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', ownerId: 1 }],
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
