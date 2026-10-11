import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp128 (mutates: [65, 70, 91, 95, 96, 100]): late fees are no longer charged and their
// figures are gone; the 2,000.00 invoice is no longer charged its 40.00 fee, so 1,500.00 and the
// interest are due. Carries the test.
// A payment pays what the invoice (or instalment) itself still owes first, then its late interest,
// so less of the invoice is left earning interest.
test.describe('invoice paid before late charges', () => {
  test('a payment pays the invoice before its late charges', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-02-15',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 2000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 500, date: '2026-03-17', allocations: [{ invoiceId: 1, amount: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // the 500.00 paid on 2026-03-17 all went to the 2,000.00, leaving 1,500.00 to earn interest
    // from then; the interest to 2026-03-17 is still unpaid, and there is no fee
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-interest')).toHaveText('$37.55');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,537.55');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,537.55');
  });
});
