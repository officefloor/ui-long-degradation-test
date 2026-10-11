import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A credit note on an invoice earning late interest reduces what the invoice owes from the credit
// note's issue date: the interest periods are split there too, and interest before that date is
// worked out on the amount owed before the credit.
test.describe('credit notes and late interest', () => {
  test('a credit note cuts the interest only from its issue date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30', creditOf: 1,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 1,000.00 from 2026-03-08 to the credit note on 2026-04-01 (24 days), then 800.00 to today (29 days)
    await expect(page.getByTestId('invoice-credited')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$15.80');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$815.80');
  });
});
