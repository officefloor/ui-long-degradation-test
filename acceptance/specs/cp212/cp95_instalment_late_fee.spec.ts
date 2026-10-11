import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; there are no instalments, so the test is replaced by one
// of an overdue invoice earning interest and no fee. Carries none of the earlier tests.
// There are no instalments; an overdue invoice earns late interest and no fee.
test.describe('late fee on instalments', () => {
  test('an overdue invoice earns interest and no fee', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-interest')).toHaveText('$5.71');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$555.71'); // 550.00 + interest
  });
});
