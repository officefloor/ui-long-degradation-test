import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A client's unused credit can be refunded from the refund form (amount and date, client level).
// The refund comes out of the oldest payment's unused credit first (lower id on the same date),
// then the next, recorded on each payment as refunded (payments[].refunded), writing
// CREDIT_REFUNDED payment=<payment id> amount=<amount taken from it> for each. A refund of zero or
// less, with more than two decimals, after today, before a payment it would come from, or bigger
// than the client's credit is refused. Refunded credit is never used on an invoice, and a payment
// that has had a refund can no longer be reversed.
test.describe('refund unused credit', () => {
  test('refunds the oldest credit first', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 25 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 50, date: '2026-01-20', allocations: [] },
        { id: 2, clientId: 1, amount: 120, date: '2026-02-10', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 3, clientId: 1, amount: 40, date: '2026-02-05', allocations: [], refunded: 10 },
      ],
    });
    await page.goto('/');

    // credit: payment 1 50.00 + payment 2 20.00 (120.00 - 100.00) + payment 3 30.00 (40.00 - 10.00 refunded)
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$100.00');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('refund-form-amount').fill('70');
    await page.getByTestId('refund-form-date').fill('2026-03-09');
    await page.getByTestId('refund-form-submit').click();
    // payment 1 (2026-01-20) gives all its 50.00, then payment 3 (2026-02-05) 20.00 of its 30.00
    await expect.poll(() => auditLines().filter((l) => l.startsWith('CREDIT_REFUNDED'))).toEqual([
      'CREDIT_REFUNDED payment=1 amount=50.00',
      'CREDIT_REFUNDED payment=3 amount=20.00',
    ]);
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$30.00'); // 100.00 - 70.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$30.00');

    // what is left: payment 3's last 10.00, then payment 2's 20.00
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=3 invoice=2 amount=10.00',
      'PAYMENT_RECORDED id=2 invoice=2 amount=15.00',
    ]);
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$5.00'); // 30.00 - 25.00
  });

  test('refuses a refund that breaks a rule, and reversing a refunded payment', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 5, clientId: 1, amount: 60, date: '2026-02-10', refunded: 5,
          allocations: [{ invoiceId: 3, amount: 50 }] },
        { id: 6, clientId: 1, amount: 20, date: '2026-02-20', allocations: [] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const bad = [
      ['0', '2026-03-09'],       // not more than zero
      ['10.005', '2026-03-09'],  // three decimals
      ['10', '2026-03-11'],      // after today (2026-03-10)
      ['10', '2026-02-15'],      // the last 5.00 would come from payment 6, made on 2026-02-20
      ['25.01', '2026-03-09'],   // credit is 5.00 + 20.00 = 25.00
    ];
    for (const [amount, date] of bad) {
      await page.getByTestId('refund-form-amount').fill(amount);
      await page.getByTestId('refund-form-date').fill(date);
      await page.getByTestId('refund-form-submit').click();
      await expect(page.getByTestId('refund-form-error')).toBeVisible();
    }
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$25.00');
    expect(auditLines().filter((l) => l.startsWith('CREDIT_REFUNDED'))).toEqual([]);

    // payment 5 has had a refund, so it can no longer be reversed
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('payment-row-5').getByTestId('payment-reverse').click();
    await expect(page.getByTestId('payment-reverse-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$50.00');
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_REVERSED'))).toEqual([]);
  });
});
