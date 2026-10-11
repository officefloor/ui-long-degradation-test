import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp80 (mutates: [63, 65, 66, 68, 70]): cp68: interest now runs from the end of the
// grace week (23 days instead of 30); cp80: interest uses an Actual/360 day count, so the overdue
// instalment's interest and the amounts change. Carries the test.
// Planned invoices earn late interest instalment by instalment: an instalment more than 7 days past
// its due date without being paid off earns interest by the same rule as an invoice, from the end
// of its grace week, on its unpaid part, in periods split by payments. Payments go to each
// instalment's interest before the instalment itself, earliest instalment first. Each instalment
// row shows its late interest; the invoice's interest is their total, part of the amount due and of
// the client's overdue amount.
test.describe('late interest on instalments', () => {
  test('an overdue instalment earns late interest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
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
    await page.getByTestId('invoice-row-1').click();
    // instalment 2 (due 2026-03-31) is unpaid: 23 days from the end of its grace week
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('$2.62');
    // instalment 3 is due today, not overdue
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-late-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$2.62');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$682.67');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$342.64');
    // paying exactly that clears instalment 2 and its interest
    await page.getByTestId('payment-form-amount').fill('342.64');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-status')).toHaveText('Due');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
  });
});
