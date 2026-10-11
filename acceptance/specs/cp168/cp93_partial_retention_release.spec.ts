import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]):
// retention is gone; nothing is held, so the two release tests are replaced by one checking that
// the release controls are gone and the invoice owes the rest of its total.
// Nothing is held back, so nothing is released: there is no Release retention button, release
// amount or retention-held figure, and the invoice owes what is left of its total.
test.describe('release part of the retention', () => {
  test('there is no retention to release', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 400, date: '2026-02-20', allocations: [{ invoiceId: 1, amount: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-release-retention')).toHaveCount(0);
    await expect(page.getByTestId('retention-release-amount')).toHaveCount(0);
    await expect(page.getByTestId('invoice-retention-held')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$600.00'); // 1,000.00 - 400.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
