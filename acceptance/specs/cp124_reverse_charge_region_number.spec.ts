import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client is reverse charged only when their valid tax number's two letters are the region they
// are taxed in. A reverse-charged invoice has no withholding.
test.describe("reverse charge needs the region's number", () => {
  test("reverse charges only a number from the client's own region, with no withholding", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'CA', taxNumber: 'NY1234567894' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA',
          taxNumber: 'CA2048163017', withholdingPct: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // a valid number, but a New York one for a California client: taxed at 7.25%
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
    await expect(page.getByTestId('invoice-tax')).toHaveText('$72.50');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,072.50');
    // reverse charged: no tax, and nothing withheld either
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,000.00');
  });
});
