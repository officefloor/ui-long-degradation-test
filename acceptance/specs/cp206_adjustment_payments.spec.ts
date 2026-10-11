import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A debit adjustment note is paid together with its invoice. A payment made with the invoice open,
// or naming the invoice's number or reference, pays the invoice and then its debit notes, oldest
// first, before anything is held as credit. When a payment is spread automatically or by Apply
// credit, a debit note is paid straight after its invoice, wherever the invoice comes in the order,
// whatever the note's own due date or amount.
test.describe("an invoice's notes are paid with it", () => {
  test('paying an invoice pays its adjustment notes next', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Extra');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('90');
    await page.getByTestId('line-form-submit').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number=ADJ-0000034 invoice=1 total=99.00');
    await page.getByTestId('payment-form-amount').fill('400');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // the invoice's 330.00, then the rest on its note (99.00), not on invoice 2
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=330.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=70.00',
    ]);
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
  });

  test('a spread payment pays a note straight after its invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-07-31', adjustmentOf: 1,
          lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 90 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('440');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // overdue invoice 1 (330.00) first, its note (99.00) straight after it, and only then the smallest,
    // invoice 3, gets the last 11.00
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=330.00',
      'PAYMENT_RECORDED id=1 invoice=2 amount=99.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=11.00',
    ]);
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Part paid');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$44.00');
  });
});
