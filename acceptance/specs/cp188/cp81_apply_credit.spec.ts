import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after the overdue invoices, a payment now
// pays the smallest amount due first; after overdue invoice 1 the credit pays invoice 3 (150.00)
// before invoice 2. Carries both tests.
// Apply credit (with a client selected) uses the client's unused credit on what they owe now: the
// oldest credit first, to their sent invoices in the payment order (overdue first, oldest due date
// first, then the smallest amount due), each paid off before the next, writing PAYMENT_RECORDED for
// each payment and invoice and counting as paid today. Deposits held for a draft are not used. It
// is refused when there is no credit to use or nothing owed.
test.describe('apply credit now', () => {
  test('applies unused credit to what the client owes', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Training', qty: 1, unitPrice: 150 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Extras', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-01-10', allocations: [] },
        { id: 2, clientId: 1, amount: 120, date: '2026-02-01', allocations: [] },
        { id: 3, clientId: 1, amount: 50, date: '2026-04-02', allocations: [], reference: 'RF34 0000 042' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$270.00'); // 100 + 120 + 50
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('client-apply-credit').click();
    // oldest credit first, to overdue invoice 1 (40.00), then the smallest amount due, invoice 3
    // (150.00), then invoice 2; payment 3 is held for draft invoice 4 and stays put
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=60.00',
      'PAYMENT_RECORDED id=2 invoice=3 amount=90.00',
      'PAYMENT_RECORDED id=2 invoice=2 amount=30.00',
    ]);
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid late');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$50.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$120.00'); // 170.00 - 50.00
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-04-20');
  });

  test('refuses when there is no credit or nothing owed', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 40, date: '2026-03-05', allocations: [{ invoiceId: 5, amount: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('client-apply-credit').click();
    await expect(page.getByTestId('client-apply-credit-error')).toBeVisible();
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });
});
