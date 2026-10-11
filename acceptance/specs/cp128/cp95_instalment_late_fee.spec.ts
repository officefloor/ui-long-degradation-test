import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp128 (mutates: [65, 70, 91, 95, 96, 100]): late fees are no longer charged and their
// figures are gone; the overdue instalment is no longer charged a fee, so the test is replaced by
// one where 341.00 clears the overdue instalment.
// An overdue instalment is charged no late fee: neither the instalment rows nor the panel show one,
// and the client's overdue amount is the overdue instalments with their late interest.
test.describe('late fee on instalments', () => {
  test('charges no late fee on an overdue instalment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 341, date: '2026-02-27', allocations: [{ invoiceId: 1, amount: 341 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // instalment 2 (due 2026-03-31) is overdue, with no fee
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Overdue');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$341.00');
    await page.getByTestId('payment-form-amount').fill('341.00');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
