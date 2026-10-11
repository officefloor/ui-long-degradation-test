import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A draft invoice can name the region where the work is done (invoices[].supplyRegion, the place of
// supply box on the panel). It is then taxed at that region's rate, and reverse charged only when
// that region is not the home region (with the client's valid number for it); without one, the
// client's region applies.
test.describe('place of supply', () => {
  test('taxes an invoice where the work was done', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'CA' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA',
          taxNumber: 'CA2048163017' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Installation', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Installation', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          supplyRegion: 'OR',
          lineItems: [{ id: 3, description: 'Installation', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$72.50'); // California's 7.25%
    await page.getByTestId('invoice-supply-region').fill('NY');
    await page.getByTestId('invoice-supply-region-submit').click();
    // done in New York: 8.875%
    await expect(page.getByTestId('invoice-tax')).toHaveText('$88.75');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,088.75');
    // done in Oregon: no tax
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    // Globex is reverse charged in California, but work done in the home region is taxed there
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
    await page.getByTestId('invoice-supply-region').fill('NY');
    await page.getByTestId('invoice-supply-region-submit').click();
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
    await expect(page.getByTestId('invoice-tax')).toHaveText('$88.75');
  });
});
