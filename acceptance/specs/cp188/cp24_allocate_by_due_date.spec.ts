import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after the overdue invoices, a payment now
// pays the smallest amount due first; after overdue invoice 4 the 150.00 pays invoice 3 (40.00),
// invoice 2 (60.00) and 20.00 of invoice 1. Carries the test.
// An automatically applied payment pays the overdue invoices first (oldest due date first, lower id on the same date), then the rest from the
// smallest amount due to the largest (lower id on the same amount), each paid off in full before the
// next.
test.describe('allocate by due date', () => {
  test('applies a payment to the earliest due date first', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 40 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-05', dueDate: '2026-03-31',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-submit').click();

    // Overdue invoice 4 (due 03-31) takes 30.00; then the smallest amount due first: invoice 3 (40.00),
    // invoice 2 (60.00), and invoice 1 (100.00) the last 20.00.
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=4 amount=30.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=40.00',
      'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',
      'PAYMENT_RECORDED id=1 invoice=1 amount=20.00',
    ]);
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00'); // 30.00 - 30.00
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00'); // 100.00 - 20.00
  });
});
