import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// When a payment is spread automatically, across several references or by Apply credit, overdue
// invoices are paid highest dunning level first (COLLECTIONS, then FINAL, REMINDER_2, REMINDER_1,
// NONE), and on the same level oldest due date first (lower id on the same date); then the rest as
// before.
test.describe('the most chased first', () => {
  test('a spread payment pays the most chased overdue invoice first', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-15',
          reminders: ['2026-04-25', '2026-05-10'],
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-01',
          reminders: ['2026-05-11'],
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 4, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('500');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // invoice 2 has reached FINAL (330.00), then invoice 3 REMINDER_2 (only 170.00 of 220.00 left), and the
    // oldest, invoice 1 at REMINDER_1, waits
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=2 amount=330.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=170.00',
    ]);
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_1');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00');
  });
});
