import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment made with a disputed invoice open is accepted: it resolves the dispute that day
// (DISPUTE_RESOLVED id=<id>, with the interest held back owed again) and pays the invoice as usual.
// Automatic payments and Apply credit still pay every undisputed invoice first, in the usual order,
// but what is left then goes to disputed invoices (oldest due date first, lower id on ties), which
// stay disputed, before anything becomes credit.
test.describe('paying a disputed invoice', () => {
  test('paying a disputed invoice settles the dispute', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          disputedOn: '2026-04-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    // a payment with it open is accepted: the client has stopped disputing it
    await page.getByTestId('payment-form-amount').fill('500');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=500.00');
    // the interest held back is owed again: 1,000.00 + 53 days' interest, less 500.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$517.82');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
  });

  test('automatic payments reach disputed invoices last', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          disputedOn: '2026-04-01',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // with no invoice open the undisputed invoice 4 is paid first; what is left goes to the disputed one
    // instead of becoming credit, and it stays disputed
    await page.getByTestId('payment-form-amount').fill('400');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=4 amount=100.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=300.00',
    ]);
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Disputed');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$708.03');
  });
});
