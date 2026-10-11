import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; the instalment interest test is replaced by one of an
// overdue invoice earning interest on its whole amount. Carries none of the earlier tests.
// There are no instalments: an overdue invoice earns late interest on everything it still owes.
test.describe('late interest on instalments', () => {
  test('an overdue invoice earns late interest on its whole amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
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
    // 1,100.00 from the end of the grace week (2026-02-07) to 2026-03-10: 31 days at 12% (Actual/360)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$11.42');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,111.42');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
  });
});
