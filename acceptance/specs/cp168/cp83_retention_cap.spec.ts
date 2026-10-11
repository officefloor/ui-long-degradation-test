import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]):
// retention is gone; with nothing held back there is nothing to cap, so the cap test is replaced by
// one checking the retention form and cap are gone.
// There is no retention, so no retention cap: the invoice shows no retention or cap boxes and owes
// its whole amount.
test.describe('retention cap', () => {
  test('there is no retention to cap', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 5000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('retention-form-pct')).toHaveCount(0);
    await expect(page.getByTestId('retention-form-cap')).toHaveCount(0);
    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$5,000.00');
  });
});
