import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]):
// retention is gone; the test of retention before tax is replaced by one showing the whole invoice,
// tax included, due and paid.
// Nothing is held back from an invoice: its amount due is its whole grand total, tax included, less
// what has been paid.
test.describe('retention before tax', () => {
  test('the whole invoice is due, tax included', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [{ id: 1, description: 'Design', qty: 3, unitPrice: 111.11 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 300, date: '2026-03-05', allocations: [{ invoiceId: 1, amount: 300 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 333.33 less 10% (33.33) = 300.00, plus 30.00 tax: 330.00, of which 300.00 is paid
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$330.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$30.00');
    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
    await page.getByTestId('payment-form-amount').fill('29.99');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // 0.01 left is written off: Paid, never Retention held
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.01');
  });
});
