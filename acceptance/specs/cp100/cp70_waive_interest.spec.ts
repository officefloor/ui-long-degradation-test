import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed, so the
// 1,000.00 invoice's fee is 20.00 and the totals waived change. Carries both tests.
// The Waive button on an overdue invoice writes off the late interest and late fee still unpaid on
// it (invoices[].interestWaivedOn records the day), writing INTEREST_WAIVED id=<id>
// amount=<amount>; the panel shows the total waived. Interest then starts again from that day on
// what is still owed, and no new fee is charged. Waiving is refused when there is nothing to waive.
test.describe('waive late charges', () => {
  test('waives the late interest and fee charged so far', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, lateFee: 25 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await page.getByTestId('invoice-waive').click();
    // the 20.00 fee and the interest so far are written off; the 1,000.00 is still overdue
    await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount=37.82');
    await expect(page.getByTestId('invoice-waived')).toHaveText('$37.82');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,000.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    // nothing to waive on an invoice that isn't overdue
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-waive').click();
    await expect(page.getByTestId('invoice-waive-error')).toBeVisible();
  });

  test('interest starts again from the day it was waived', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, lateFee: 25 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-02-01',
          interestWaivedOn: '2026-03-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // waived on 2026-03-31: since then 30 days on the 1,000.00 still owed, and no second fee
    await expect(page.getByTestId('invoice-interest')).toHaveText('$10.05'); // 1,000.00 x ((1 + 0.12/360)^30 - 1)
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-waived')).toHaveText('$37.14');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,010.05');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,010.05');
  });
});
