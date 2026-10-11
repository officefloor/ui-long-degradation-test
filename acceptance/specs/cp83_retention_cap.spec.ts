import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Retention can be capped at a maximum amount (invoices[].retentionCap, entered with the retention
// percentage): the retention is the percentage worked out as usual, but never more than the cap.
test.describe('retention cap', () => {
  test('caps the retention at a maximum amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 2000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          retentionPct: 10, retentionCap: 100,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('retention-form-pct').fill('10');
    await page.getByTestId('retention-form-cap').fill('150');
    await page.getByTestId('retention-form-submit').click();
    // 10% of 2,000.00 is 200.00, capped at 150.00
    await expect(page.getByTestId('invoice-retention')).toHaveText('$150.00');
    // a cap above the percentage changes nothing: 10% of 500.00 = 50.00
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-retention')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$450.00'); // 500.00 - 50.00
  });
});
