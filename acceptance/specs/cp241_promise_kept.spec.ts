import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// When payments since a promise to pay reach the promised amount by its date, the late interest
// that ran from the day the promise was made until the day it was kept is waived (INTEREST_WAIVED
// id=<id> amount=<waived>); interest from before the promise stays owed, and interest after it runs
// as usual on what is still overdue.
test.describe('a kept promise waives its interest', () => {
  test('keeping a promise waives the interest that ran while it stood', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          promiseAmount: 600, promiseDate: '2026-06-20', promisedOn: '2026-05-27',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          promiseAmount: 600, promiseDate: '2026-06-20', promisedOn: '2026-05-27',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 300, date: '2026-06-01', allocations: [{ invoiceId: 1, amount: 300 }] },
        { id: 2, clientId: 1, amount: 300, date: '2026-06-01', allocations: [{ invoiceId: 2, amount: 300 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Promised');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$11.60');
    await page.getByTestId('payment-form-amount').fill('300');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // 300.00 + 300.00 since 2026-05-27 keeps the promise of 600.00 by 2026-06-20: the interest from
    // 2026-05-27 to today is waived; what ran from the end of grace (2026-05-07) to the promise stays
    await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount=4.23');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$7.36');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$507.36');
    // invoice 2's promise still stands, its interest running
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$11.60');
  });
});
