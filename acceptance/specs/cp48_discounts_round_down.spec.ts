import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Percentage discounts, on the invoice and on lines, are rounded down to the cent instead of half
// up, so never more than the percentage is given away.
test.describe('discounts round down', () => {
  test('percentage discounts round down to the cent', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 12.5,
          lineItems: [{ id: 1, description: 'Licences', qty: 4, unitPrice: 25.25 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Kit', qty: 3, unitPrice: 33.35, discountPct: 15 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$12.62'); // 12.5% of 101.00 = 12.625 -> 12.62
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$88.38'); // 101.00 - 12.62

    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    // 15% of (3 x 33.35 = 100.05) = 15.0075 -> 15.00
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount')).toHaveText('$15.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$85.05'); // 100.05 - 15.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$85.05');
  });
});
