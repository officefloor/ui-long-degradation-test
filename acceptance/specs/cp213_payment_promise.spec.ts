import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An overdue invoice can take a promise to pay: an amount (at least 10% of its amount due and no
// more than it) by a date (after today and at most 30 days ahead), recorded with the day it was
// made (invoices[].promiseAmount, promiseDate, promisedOn) and written as PAYMENT_PROMISED id=<id>
// amount=<amount> date=<date>. Until that date, unless payments since the promise reach the
// promised amount, the invoice is Promised rather than Overdue: it is not in the client's overdue
// amount and is not paid first as an overdue invoice when a payment is spread, though late interest
// still runs. Once the promise is kept, anything still owed is overdue as usual. An invoice that is
// not overdue, or whose promise was broken (its date passed short of the amount), takes no promise.
test.describe('a promise to pay', () => {
  test('a promise to pay holds an overdue invoice off until its date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-15', dueDate: '2026-05-15',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,106.99');
    await page.getByTestId('invoice-promise-amount').fill('500');
    await page.getByTestId('invoice-promise-date').fill('2026-06-20');
    await page.getByTestId('invoice-promise-submit').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_PROMISED id=1 amount=500.00 date=2026-06-20');
    // no longer overdue, though late interest still runs
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Promised');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$6.99');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
    // only an overdue invoice can take a promise
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-promise-amount').fill('20');
    await page.getByTestId('invoice-promise-date').fill('2026-06-20');
    await page.getByTestId('invoice-promise-submit').click();
    await expect(page.getByTestId('invoice-promise-error')).toBeVisible();
  });

  test('a promised invoice is not paid first, and once kept it is overdue again', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-15', dueDate: '2026-05-15',
          promiseAmount: 500, promiseDate: '2026-06-20', promisedOn: '2026-06-10',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // naming both invoices: the promised one is not overdue, so the smaller invoice 2 is paid first
    await page.getByTestId('payment-form-amount').fill('300');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-reference').fill('INV-0000018, INV-0000026');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=2 amount=55.00',
      'PAYMENT_RECORDED id=1 invoice=1 amount=245.00',
    ]);
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Promised');
    // 245.00 + 255.00 keeps the promise of 500.00: what is left is overdue again
    await page.getByTestId('payment-form-amount').fill('255');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$606.99');
  });

  test('a broken promise leaves the invoice overdue and takes no new one', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          promiseAmount: 200, promiseDate: '2026-06-05', promisedOn: '2026-05-29',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    // nothing was paid by 2026-06-05
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-promise-amount').fill('200');
    await page.getByTestId('invoice-promise-date').fill('2026-06-25');
    await page.getByTestId('invoice-promise-submit').click();
    await expect(page.getByTestId('invoice-promise-error')).toBeVisible();
  });
});
