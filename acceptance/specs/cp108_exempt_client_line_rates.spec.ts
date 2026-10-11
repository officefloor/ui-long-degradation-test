import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A tax-exempt client is exempt from the general rate only (their region's or the workspace's): a
// line with its own tax rate is still taxed at that rate. Their exempt lines and minimum charge are
// not taxed, and a reverse-charged client still pays no tax at all.
test.describe('exempt clients and line rates', () => {
  test("a tax-exempt client still pays a line's own rate", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        homeRegion: 'NY',
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', taxExempt: true },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA',
          taxNumber: 'CA2048163017' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Catering', qty: 1, unitPrice: 18.4 },
            { id: 2, description: 'Wine', qty: 1, unitPrice: 13.35, taxRate: 12.5 },
            { id: 3, description: 'Delivery', qty: 1, unitPrice: 6, taxExempt: true },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 4, description: 'Catering', qty: 1, unitPrice: 60 },
            { id: 5, description: 'Wine', qty: 1, unitPrice: 13.35, taxRate: 12.5 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // the exemption covers the general rate only: the wine keeps its own 12.5% (12.5% of 13.35 = 1.66875)
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$1.67');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.00');
    // 18.40 + 13.35 + 6.00 = 37.75 is topped up by 12.25 to the 50.00 minimum, which is not taxed
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$12.25');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.67');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$51.67'); // 50.00 + 1.67
    // a reverse-charged client pays no tax at all
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$73.35');
  });
});
