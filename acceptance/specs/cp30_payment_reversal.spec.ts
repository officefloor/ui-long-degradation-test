import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment can be reversed from the invoice panel (a bounced cheque): the whole payment is undone on
// every invoice it was applied to, it drops out of their payments, their paid, amount due and status
// go back accordingly, and PAYMENT_REVERSED id=<payment id> amount=<amount> is written. A payment
// seeded as reversed (payments[].reversed) does not count.
test.describe('reverse a payment', () => {
  test('reversing a split payment undoes it on every invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 90, date: '2026-03-02',
          allocations: [{ invoiceId: 1, amount: 60 }, { invoiceId: 2, amount: 30 }] },
        { id: 2, clientId: 1, amount: 20, date: '2026-03-04', allocations: [{ invoiceId: 1, amount: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$80.00'); // 60.00 + 20.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$20.00');
    await page.getByTestId('payment-row-1').getByTestId('payment-reverse').click();

    await expect(page.getByTestId('payment-row-1')).toHaveCount(0);
    await expect(page.getByTestId('invoice-paid')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00'); // 100.00 - 20.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$130.00'); // 80.00 + 50.00
    await expect.poll(() => auditLines()).toContain('PAYMENT_REVERSED id=1 amount=90.00');
  });

  test('a reversed payment does not count', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 3, clientId: 1, amount: 50, date: '2026-03-02', reversed: true, allocations: [{ invoiceId: 3, amount: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('payment-row-3')).toHaveCount(0);
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00');
  });
});
