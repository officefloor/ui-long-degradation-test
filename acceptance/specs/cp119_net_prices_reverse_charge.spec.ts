import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// When a client whose prices include tax is reverse charged, the tax is taken out of their prices
// as usual (lines reconciled to the invoice tax) but not charged: they pay the net, the lines show
// their net and no tax, and the grand total is the amount before tax.
test.describe('net prices when reverse charged', () => {
  test('a reverse-charged client pays the prices without their tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'CA', taxNumber: 'CA2048163017',
          pricesIncludeTax: true },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA', pricesIncludeTax: true },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 107.25 },
            { id: 2, description: 'Pens', qty: 1, unitPrice: 10 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 3, description: 'Design', qty: 1, unitPrice: 107.25 },
            { id: 4, description: 'Pens', qty: 1, unitPrice: 10 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // the prices include California's 7.25%: 107.25 / 1.0725 = 100.00, 10.00 / 1.0725 = 9.32;
    // reverse charged, the client pays only the 109.32 net, and no tax is charged
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
    await expect(page.getByTestId('line-row-1').getByTestId('line-net')).toHaveText('$100.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-net')).toHaveText('$9.32');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$109.32');
    await expect(page.getByTestId('invoice-net')).toHaveText('$109.32');
    // without a tax number the same prices are paid in full, 7.93 of them tax
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$117.25');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.93');
  });
});
