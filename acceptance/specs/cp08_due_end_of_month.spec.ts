import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A new invoice is due on the last day of the month after the month it is issued in.
test.describe('due at the end of the following month', () => {
  test('a new invoice is due at the end of next month', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    const row = page.getByTestId('invoice-row-1');
    await expect(row.getByTestId('invoice-issue')).toHaveText('2026-01-31');
    // Last day of February 2026 (30 days later would be 2026-03-02).
    await expect(row.getByTestId('invoice-due')).toHaveText('2026-02-28');
  });

  test('an invoice issued in December is due at the end of January', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-12-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-11-02', dueDate: '2026-12-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2027-01-31');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-12-31');
  });
});
