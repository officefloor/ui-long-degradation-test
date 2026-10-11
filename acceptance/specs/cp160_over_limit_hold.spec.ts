import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A client whose balance is over their credit limit is on hold automatically (shown "On hold", with
// all that a hold means) until their balance is back within the limit; the Hold button can't lift
// it while they are over. A payment recorded for a client on hold now pays their overdue invoices
// first, oldest due date first (lower id on the same date), whatever invoice is open; only what is
// left is held as credit.
test.describe('on hold over the limit', () => {
  test('a client over its credit limit is on hold until it is back within it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 500 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-24', dueDate: '2026-02-25',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-20', dueDate: '2026-02-26',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 250 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Hosting', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    // 650.00 owed against a 500.00 limit: on hold by itself
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('-$150.00');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // the payment goes to the overdue invoices, oldest due date first, not the open one
    await page.getByTestId('payment-form-amount').fill('400');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=300.00',
      'PAYMENT_RECORDED id=1 invoice=2 amount=100.00',
    ]);
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    // 250.00 owed now: back within the limit, so no longer on hold
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });
});
