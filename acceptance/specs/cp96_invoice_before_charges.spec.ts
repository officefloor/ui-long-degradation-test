import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A payment now pays what the invoice (or instalment) itself still owes first, then its late fee,
// then its late interest, so less of the invoice is left earning interest.
test.describe('invoice paid before late charges', () => {
  test('a payment pays the invoice before its late charges', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, lateFee: 25 },
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
    // from then; the 25.00 fee and the interest to 2026-03-17 are still unpaid
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$25.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$37.55');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,562.55');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,562.55');
  });
});
