import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment applied automatically, across several references, or by Apply credit pays the overdue
// invoices first (oldest due date first, lower id on the same date), then the rest from the
// smallest amount due to the largest (lower id on the same amount), each paid off before the next;
// disputed amounts still come last.
test.describe('smallest amounts first', () => {
  test('after the overdue invoices, pays the smallest amounts first', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-05-15',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-submit').click();
    // the overdue invoice 1 (40.00) first; then the smallest amount due first: invoice 3 (30.00), then
    // 130.00 of invoice 4 (150.00); invoice 2 (200.00) gets nothing (largest first would have put 160.00 on it)
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=30.00',
      'PAYMENT_RECORDED id=1 invoice=4 amount=130.00',
    ]);
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$220.00'); // 200.00 + 20.00
    // named invoices are paid the same way: invoice 4's last 20.00 before invoice 2
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-reference').fill('INV-0000026, INV-0000042');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED id=2'))).toEqual([
      'PAYMENT_RECORDED id=2 invoice=4 amount=20.00',
      'PAYMENT_RECORDED id=2 invoice=2 amount=80.00',
    ]);
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$120.00'); // 200.00 - 80.00
  });
});
