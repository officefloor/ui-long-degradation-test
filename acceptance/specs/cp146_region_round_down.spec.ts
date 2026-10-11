import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// In the regions the workspace lists as rounding tax down (settings.regionRoundDown), each rate's
// tax on an invoice taxed there is rounded down to the cent instead of half up, and for prices that
// include tax the tax taken out is rounded down before it is reconciled over the lines.
test.describe('regions that round tax down', () => {
  test('rounds tax down in regions that require it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, regionRoundDown: ['CA'] },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'CA' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA', pricesIncludeTax: true },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'NY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 49.99 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 2, description: 'Design', qty: 1, unitPrice: 10 },
            { id: 3, description: 'Pens', qty: 1, unitPrice: 2.5 },
          ] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 2, unitPrice: 49.99 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 7.25% of 99.98 = 7.24855: California rounds it down to 7.24
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.24');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$107.22');
    // prices including tax: 12.50 - 12.50 / 1.0725 = 0.84499, down to 0.84; per line 10.00 / 1.0725 = 9.32
    // (tax 0.68) and 2.50 / 1.0725 = 2.33 (0.17) make 0.85, so a cent comes back off the larger line
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.84');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.67');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.17');
    await expect(page.getByTestId('line-row-2').getByTestId('line-net')).toHaveText('$9.33');
    // New York rounds half up as usual: 8.875% of 99.98 = 8.873225
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-tax')).toHaveText('$8.87');
  });
});
