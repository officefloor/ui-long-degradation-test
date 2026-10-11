import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]):
// retention is gone; there is no released retention to earn interest, so the test is replaced by
// one where the 100.00 left unpaid earns interest from the end of the invoice's grace week.
// With no retention, whatever is left of an invoice after the end of its grace period earns late
// interest from then, by the usual rule.
test.describe('interest on released retention', () => {
  test('what is left unpaid earns interest from the end of grace', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-05', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 900, date: '2026-01-20', allocations: [{ invoiceId: 1, amount: 900 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 100.00 was still owed at the end of the grace week (2026-02-07): 82 days to today,
    // 100.00 x ((1 + 0.12/360)^82 - 1)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$2.77');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$102.77');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$102.77');
  });
});
