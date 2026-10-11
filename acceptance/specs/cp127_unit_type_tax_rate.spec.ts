import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A rate card entry can carry a tax rate (clients[].rates[].taxRate): lines of that unit type are
// taxed at it instead of the client's regional or workspace rate, unless the line has its own rate.
// It is a rate like any other in the tax worked out per rate, and for prices that include tax.
test.describe('tax rate by unit type', () => {
  test('taxes a unit type at its own rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY',
          rates: [{ unitType: 'book', unitPrice: 12.5, taxRate: 5 }, { unitType: 'hour', unitPrice: 95 }] },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NY', pricesIncludeTax: true,
          rates: [{ unitType: 'book', unitPrice: 12.5, taxRate: 5 }, { unitType: 'hour', unitPrice: 95 }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 4,
          lineItems: [
            { id: 1, description: 'Books', qty: 3, unitType: 'book' },
            { id: 2, description: 'Consulting', qty: 2, unitType: 'hour' },
            { id: 3, description: 'Gift book', qty: 1, unitType: 'book', taxRate: 0 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 4, description: 'Books', qty: 3, unitType: 'book' },
            { id: 5, description: 'Consulting', qty: 2, unitType: 'hour' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // books are taxed at the card's 5% instead of New York's 8.875%; the gift book's own 0% wins
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$1.80');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$16.19');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$17.99');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$248.39');
    // prices including tax: the books' 5% is taken out on its own (37.50 - 37.50 / 1.05 = 1.79)
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$1.79');
    await expect(page.getByTestId('line-row-5').getByTestId('line-tax')).toHaveText('$15.49');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$17.28');
    await expect(page.getByTestId('invoice-net')).toHaveText('$210.22');
  });
});
