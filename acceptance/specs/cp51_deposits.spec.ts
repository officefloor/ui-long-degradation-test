import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment can be recorded as a deposit (the Deposit box on the payment form): the whole amount is
// held on the client's account as credit, applied to no invoice even when one is open, and
// DEPOSIT_RECORDED id=<payment id> client=<client id> amount=<amount> is written. Any part of a
// payment not applied to an invoice (payments[].allocations adding up to less than its amount) is
// credit. The client list shows each client's unused credit and takes it off their balance. Sending
// an invoice uses the client's credit on it straight away, up to its amount due, the oldest payment
// first (lower id on the same date), writing PAYMENT_RECORDED for each payment used. Credit used is
// recorded as applied on that day (allocations[].date), and counts as paid on that day for the paid
// date and Paid late.
test.describe('deposits held as credit', () => {
  test('holds a deposit as credit and uses it when an invoice is sent', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-02', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // even with a draft open, a deposit goes to the client's account, not the invoice
    await page.getByTestId('payment-form-deposit').check();
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('DEPOSIT_RECORDED id=1 client=1 amount=100.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$100.00');
    // nothing sent yet, less 100.00 of credit
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$100.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');

    await page.getByTestId('invoice-send').click();
    // sent today: the 80.00 invoice takes 80.00 of the credit on the day it is sent
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$80.00');
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-03-10');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=80.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00'); // 100.00 - 80.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$20.00');

    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    // only 20.00 of credit is left for the 50.00 invoice
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$30.00'); // 50.00 - 20.00
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=20.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$30.00');
  });

  test('uses the oldest credit first and counts it as paid on the day it is applied', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-02-20',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
        { id: 6, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 70 }] },
      ],
      payments: [
        { id: 3, clientId: 1, amount: 100, date: '2026-02-01',
          allocations: [{ invoiceId: 5, amount: 40, date: '2026-03-01' }] },
        { id: 4, clientId: 1, amount: 30, date: '2026-01-15', allocations: [] },
      ],
    });
    await page.goto('/');

    // payment 3 (100.00 on 2026-02-01) was applied to invoice 5 only on 2026-03-01, after its
    // 2026-02-20 due date; payment 4 is a 30.00 deposit
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$90.00'); // 60.00 + 30.00
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-03-01');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');

    await page.getByTestId('invoice-row-6').click();
    await page.getByTestId('invoice-send').click();
    // the oldest credit first: payment 4 (2026-01-15) gives 30.00, then payment 3 the other 40.00
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=4 invoice=6 amount=30.00',
      'PAYMENT_RECORDED id=3 invoice=6 amount=40.00',
    ]);
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00'); // 90.00 - 70.00
  });
});
