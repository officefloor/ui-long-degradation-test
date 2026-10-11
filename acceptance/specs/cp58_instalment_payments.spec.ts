import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Payments on a planned invoice pay its instalments in order, each paid off before the next. Each
// instalment row shows what has been paid on it and its status: Paid, Part paid, Overdue (more than
// 7 days past its due date and not paid off) or Due. A planned invoice is Overdue when any
// instalment is, instead of by its own due date; the client's overdue amount counts only what is
// unpaid on overdue instalments; and the invoice list shows the next unpaid instalment's due date.
// A payment on a planned invoice must be at least what is still unpaid on the earliest unpaid
// instalment unless it settles the plan; the 10% minimum does not apply to it.
test.describe('paying instalments', () => {
  test('pays instalments in order and goes overdue by instalment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 340.02, date: '2026-02-27',
          allocations: [{ invoiceId: 1, amount: 340.02 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // instalment 1 was paid; instalment 2 was due 2026-03-31, more than 7 days ago
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-03-31');
    // only the unpaid overdue instalment is overdue; the balance is the plan total less what is paid
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$340.02');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$680.05');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Overdue');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-status')).toHaveText('Due');

    // less than the $340.02 still unpaid on instalment 2
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-04-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await page.getByTestId('payment-form-amount').fill('400');
    await page.getByTestId('payment-form-submit').click();
    // instalment 2 takes $340.02, instalment 3 the rest of the 400.00
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-paid')).toHaveText('$59.98');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$280.05');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
  });

  test('a payment must cover the earliest unpaid instalment, not a tenth of the total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31', instalments: 3,
          instalmentRate: 0,
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 90 }] },
      ],
      payments: [
        { id: 3, clientId: 1, amount: 28, date: '2026-03-20', allocations: [{ invoiceId: 2, amount: 28 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // 30.00 a month: instalment 1 (due 2026-04-01) has 2.00 left and is overdue
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('Overdue');
    // 2.00 is under 10% of the 90.00 total but covers what instalment 1 still needs
    await page.getByTestId('payment-form-amount').fill('2');
    await page.getByTestId('payment-form-date').fill('2026-04-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$60.00'); // 90.00 - 30.00
    // 1.00 is short of the 30.00 instalment 2 needs, and settles nothing
    await page.getByTestId('payment-form-amount').fill('1');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$30.00');
  });
});
