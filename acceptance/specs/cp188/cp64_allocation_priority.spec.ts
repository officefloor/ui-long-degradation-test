import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after the overdue invoices, a payment now
// pays the smallest amount due first; the 300.00 pays invoices 1 and 2 (overdue), then 3 (30.00), 5
// (150.00) and 20.00 of 4; the named 250.00 pays 3, 5 and 70.00 of 4. Carries both tests (the first
// renamed).
// A payment applied automatically, or across several references, pays the client's overdue invoices
// first (oldest due date first, lower id on the same date), then the rest from the smallest amount
// due to the largest (lower id on the same amount), each paid off before the next.
test.describe('payment priority', () => {
  test('pays overdue invoices first, then the smallest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-05', dueDate: '2026-04-05',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-15',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 200 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Training', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('300');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-submit').click();
    // overdue first, oldest due date first: 1 (due 03-31) 40.00, 2 (04-05) 60.00; then the smallest
    // amount due first: 3 (30.00; due 04-15, within its grace week, so not overdue), 5 (150.00), and
    // 20.00 of 4 (200.00).
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',
      'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=30.00',
      'PAYMENT_RECORDED id=1 invoice=5 amount=150.00',
      'PAYMENT_RECORDED id=1 invoice=4 amount=20.00',
    ]);
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid late');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$180.00'); // 200.00 - 20.00
  });

  test('pays named invoices the same way', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-05', dueDate: '2026-04-05',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-15',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 200 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Training', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('250');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-reference').fill('INV-0000034, INV-0000042, INV-0000059');
    await page.getByTestId('payment-form-submit').click();
    // none of the three is overdue: smallest first, 3 (30.00), then 5 (150.00), then 70.00 of 4
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=3 amount=30.00',
      'PAYMENT_RECORDED id=1 invoice=5 amount=150.00',
      'PAYMENT_RECORDED id=1 invoice=4 amount=70.00',
    ]);
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid late');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Paid');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$130.00'); // 200.00 - 70.00
  });
});
