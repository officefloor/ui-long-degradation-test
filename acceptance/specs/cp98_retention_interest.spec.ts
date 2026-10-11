import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Released retention that is still unpaid once it is overdue (more than the grace period past its
// due date, 30 days after release) earns late interest by the same rule as an invoice, from the end
// of its grace period.
test.describe('interest on released retention', () => {
  test('released retention earns interest once overdue', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-05', dueDate: '2026-01-31',
          retentionPct: 10, retentionReleasedOn: '2026-02-10',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 900, date: '2026-01-20', allocations: [{ invoiceId: 1, amount: 900 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // the 100.00 released on 2026-02-10 was due 2026-03-12; from the end of its grace week
    // (2026-03-19) to today is 42 days: 100.00 x ((1 + 0.12/360)^42 - 1)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$1.41');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$101.41');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$101.41');
  });
});
