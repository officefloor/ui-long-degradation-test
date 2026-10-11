import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A dispute only holds late interest back while it lasts: once it is resolved, the invoice owes the
// interest it would have earned with no dispute at all, including the days in dispute.
test.describe('interest after a dispute', () => {
  test('resolving a dispute charges the interest it held back', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          disputedOn: '2026-04-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // in dispute since 2026-04-01: interest ran only from 2026-03-08, 24 days
    await expect(page.getByTestId('invoice-interest')).toHaveText('$8.03');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    await page.getByTestId('invoice-resolve').click();
    // resolved: 53 days' interest from 2026-03-08, as if never disputed (24 days would leave 8.03)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,017.82');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,017.82');
  });
});
