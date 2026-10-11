import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// When two lines' leftover fractions are equal in the discount split, the leftover cent goes to the
// line with the larger amount, and to the lower line id only when the amounts are equal too.
test.describe('discount split ties', () => {
  test('a tied leftover cent goes to the larger line', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 1, description: 'Basic', qty: 1, unitPrice: 20.05 },
            { id: 2, description: 'Premium', qty: 1, unitPrice: 40.05 },
            { id: 3, description: 'Standard', qty: 1, unitPrice: 39.90 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00'); // 10% of 100.00
    // Exact shares 200.5, 400.5, 399.0 cents: one cent left, lines 1 and 2 tie on .5, and line 2 is
    // larger (40.05 > 20.05) so it takes the cent (the lower id would have given it to line 1).
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$2.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$4.01');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$3.99');
  });
});
