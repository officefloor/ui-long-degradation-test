import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment for more than the invoices it goes to still owe is no longer refused: against the open
// invoice, by reference or applied automatically, they are paid as usual and the rest is held on
// the client's account as credit, writing CREDIT_HELD payment=<payment id> amount=<amount held>.
// The payment shows its whole amount and, per invoice, the part applied there. Held credit is used
// like a deposit when the client's next invoice is sent.
test.describe('overpayments held as credit', () => {
  test('keeps what an open-invoice payment overpays as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Retainer', qty: 1, unitPrice: 150 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-02', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 150.00 settles the invoice; the other 50.00 is held on the client's account
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$200.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$150.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=150.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=50.00'); // 200.00 - 150.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$50.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$50.00');

    // the held credit pays the next invoice sent
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=30.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00'); // 50.00 - 30.00
  });

  test('a reference or automatic payment beyond what is owed is held as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Support', qty: 1, unitPrice: 50 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('RF24 0000 125'); // invoice 12, 80.00 due
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00'); // 100.00 - 80.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00');

    // no invoice open, no reference: 170.00 against the 150.00 still owed
    await page.getByTestId('payment-form-reference').fill('');
    await page.getByTestId('payment-form-amount').fill('170');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=1 amount=100.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=3 amount=50.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00'); // 170.00 - 150.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$40.00'); // 20.00 + 20.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$40.00');
  });
});
