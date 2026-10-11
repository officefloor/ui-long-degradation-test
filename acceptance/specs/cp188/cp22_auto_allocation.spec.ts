import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after the overdue invoices, a payment now
// pays the smallest amount due first; the 150.00 pays invoice 3 (50.00) and invoice 2 (80.00) and
// 20.00 of invoice 1, instead of all of invoice 1 and 50.00 of invoice 2. Carries both tests.
// A payment recorded with no invoice open and no split is applied to the client's unpaid sent
// invoices automatically: overdue invoices first (oldest due date first, lower id on the same date), then the rest from the
// smallest amount due to the largest (lower id on the same amount), each paid off in full before the
// next. Whatever is paid beyond everything the client owes is held as credit
// (CREDIT_HELD payment=<id> amount=<amount>).
test.describe('automatic allocation', () => {
  test('applies a payment to the oldest invoices first', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-20', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 80 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 50 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-01-05', dueDate: '2026-02-28',
          lineItems: [{ id: 4, description: 'Extras', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();

    // None is overdue yet: invoice 3 (50.00, the smallest) is paid off, then invoice 2 (80.00), and
    // invoice 1 (100.00) takes the last 20.00; the draft is untouched.
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=50.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=80.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=20.00');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00'); // 100.00 - 20.00
  });

  test('holds what is paid beyond everything owed as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-20', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 80 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 50 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-01-05', dueDate: '2026-02-28',
          lineItems: [{ id: 4, description: 'Extras', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // owed: 100.00 + 80.00 + 50.00 = 230.00 (the draft does not count)
    await page.getByTestId('payment-form-amount').fill('250');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    for (const id of [1, 2, 3]) {
      await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Paid');
    }
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00'); // 250.00 - 230.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$20.00');
  });
});
