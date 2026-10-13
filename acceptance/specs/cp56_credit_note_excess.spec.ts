import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A credit note may be for more than its original still owes. Issuing it takes off what the
// original owes, then its held retention, and the rest is held on the client's account as a credit
// payment dated the day it is issued (payments[].creditNote names the credit note), writing
// CREDIT_HELD payment=<payment id> amount=<amount>. The original shows only what it took as
// Credited. Credit from a credit note is used and refunded like any other credit, but cannot be
// reversed.
test.describe('credit notes beyond what is owed', () => {
  test('a credit note for more than is owed leaves the rest as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 8, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 7,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 50 }] },
        { id: 9, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 15 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 70, date: '2026-03-02', allocations: [{ invoiceId: 7, amount: 70 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-8').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Credit note');
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=8 number=CN-0000083 invoice=7 total=50.00');
    // invoice 7 owed 30.00 (100.00 - 70.00): the other 20.00 becomes credit payment 2
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00');
    await page.getByTestId('invoice-row-7').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-7').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-credited')).toHaveText('$30.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00');

    // the credit pays the next invoice sent, but can't be reversed like a payment
    await page.getByTestId('invoice-row-9').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-9').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=9 amount=15.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$5.00'); // 20.00 - 15.00
    await page.getByTestId('payment-row-2').getByTestId('payment-reverse').click();
    await expect(page.getByTestId('payment-reverse-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
  });

  test('a credit note takes held retention before it leaves credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 10, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          retentionPct: 10,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 100 }] },
        { id: 11, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 10,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 30 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 90, date: '2026-02-20', allocations: [{ invoiceId: 10, amount: 90 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 90.00 paid; only the 10.00 retention is left, held
    await expect(page.getByTestId('invoice-row-10').getByTestId('invoice-status')).toHaveText('Retention held');
    await page.getByTestId('invoice-row-11').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // the 30.00 credit note clears the 10.00 retention; 20.00 is held as credit
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00');
    await expect(page.getByTestId('invoice-row-10').getByTestId('invoice-status')).toHaveText('Paid');
    await page.getByTestId('invoice-row-10').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-10').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-credited')).toHaveText('$10.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$20.00'); // 20.00 credit
  });

  test('credit from an earlier credit note is used like any credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 20, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 50 }] },
        { id: 21, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31', creditOf: 20,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 22, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 20 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 30, date: '2026-03-01', allocations: [], creditNote: 21 }],
    });
    await page.goto('/');

    // credit note 21 (80.00) cleared invoice 20's 50.00 and left 30.00 as credit payment 1
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$30.00');
    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-20').getByTestId('invoice-status')).toHaveText('Credited');
    await page.getByTestId('invoice-row-22').click();
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=22 amount=20.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$10.00'); // 30.00 - 20.00
  });
});
