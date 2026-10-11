import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Late interest is counted from the end of the week's grace (7 days after the due date, or after an
// instalment's due date) instead of from the due date itself; everything else about it is
// unchanged.
test.describe('interest after the grace week', () => {
  test('counts interest from the end of the grace week', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-15',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // due 2026-03-01: interest from 2026-03-08 to 2026-04-30 is 53 days, not 60
    // 1,000.00 x ((1 + 0.12/365)^53 - 1)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.57');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,017.57');
    // due 2026-04-15: 2026-04-22 to today is 8 days
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$2.63');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$2,020.20');
  });
});
