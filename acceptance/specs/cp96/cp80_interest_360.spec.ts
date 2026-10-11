import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp96 (mutates: [63, 80, 86]): a payment now pays the invoice before its late
// interest, so invoice 2's 500.00 leaves 1,500.00 earning interest from 2026-03-17 and the interest
// before it unpaid. Carries the test.
// Late interest (on invoices and on instalments) is compounded daily at the annual rate / 360
// (Actual/360) instead of / 365: a balance B owing for d days earns B x ((1 + rate / 100 / 360)^d -
// 1), rounded half up to the cent. Everything else about it is unchanged.
test.describe('interest on a 360-day year', () => {
  test('counts interest on a 360-day year', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-02-15',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 2000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 500, date: '2026-03-17', allocations: [{ invoiceId: 2, amount: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 53 days from the end of the grace week: 1,000.00 x ((1 + 0.12/360)^53 - 1) (17.57 on 365 days)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,017.82');
    // 2,000.00 for the 23 days to the payment, then what is still owed for the 44 days to today
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$37.55');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,537.55');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$2,555.37');
  });
});
