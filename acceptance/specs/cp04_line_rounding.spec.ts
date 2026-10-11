import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each line's quantity x unit price is rounded half up to the cent on its own, and the invoice
// total is the sum of those rounded lines.
test.describe('line rounding', () => {
  test('rounds each line before adding them up', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 2.5, unitPrice: 10.25 },
            { id: 2, description: 'Review', qty: 0.75, unitPrice: 30.10 },
            { id: 3, description: 'Calls', qty: 1.5, unitPrice: 0.35 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 2.5 x 10.25 = 25.625 -> 25.63; 0.75 x 30.10 = 22.575 -> 22.58; 1.5 x 0.35 = 0.525 -> 0.53;
    // 25.63 + 22.58 + 0.53 = 48.74 (rounding the exact sum 48.725 once would give 48.73).
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$48.74');
  });
});
