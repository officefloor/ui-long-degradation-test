import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; a credit note no longer re-works instalments, so both
// tests are replaced by one showing a credit note coming straight off what the invoice owes.
// Carries none of the earlier tests.
// There are no instalment plans: an issued credit note comes off what its invoice owes.
test.describe('credit notes on a plan', () => {
  test('a credit note comes straight off the invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200 },
          ] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-05', dueDate: '2026-03-05', creditOf: 1,
          lineItems: [{ id: 3, description: 'Travel', qty: 1, unitPrice: 200, creditOfLine: 2 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    // 1,320.00 less the 220.00 credited
    await expect(page.getByTestId('invoice-credited')).toHaveText('$220.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,100.00');
  });
});
