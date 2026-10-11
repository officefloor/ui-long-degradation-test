import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed with a
// $10.00 minimum, so the overdue 341.00 instalment is charged 10.00 instead of 25.00. Carries the
// test.
// Planned invoices are charged the late fee too: once per instalment, when it becomes Overdue,
// never more than 10% of that instalment. Each instalment row shows its late fee; the invoice's
// late fee is their total, part of the amount due and the client's overdue amount, and a payment
// pays an instalment's own amount first, then its fee, then its interest.
test.describe('late fee on instalments', () => {
  test('charges the late fee on an overdue instalment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateFee: 25 },
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
    // instalment 2 (due 2026-03-31) is overdue: 2% of it, at least $10.00, no more than 10% of the instalment
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-fee')).toHaveText('$10.00');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-late-fee')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$10.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$351.00');
    await page.getByTestId('payment-form-amount').fill('351.00');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
