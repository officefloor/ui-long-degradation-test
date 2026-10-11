import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp24 (mutates: [22]): automatic payments now go to the earliest due date first, so the
// 150.00 pays invoice 3 (due 03-31) then invoice 1 (04-30) in full and leaves invoice 2 (due 05-31)
// untouched. Carries both tests; the refusal is unchanged.
// A payment recorded with no invoice open and no split is applied to the client's unpaid sent
// invoices automatically: earliest due date first (lower id first on the same date), each paid off
// in full before the next. A payment bigger than everything the client owes is refused.
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

    // Invoice 3 (due 03-31) takes 50.00, then invoice 1 (due 04-30) its 100.00; invoice 2 (issued
    // first but due 05-31) and the draft are untouched.
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=50.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=100.00');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00'); // 100.00 - 100.00
  });

  test('refuses more than the client owes', { tag: '@error' }, async ({ page }) => {
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
    // Owed: 100.00 + 80.00 + 50.00 = 230.00 (the draft does not count)
    await page.getByTestId('payment-form-amount').fill('230.01');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    for (const id of [1, 2, 3]) {
      await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Sent');
    }
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });
});
