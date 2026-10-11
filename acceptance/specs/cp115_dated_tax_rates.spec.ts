import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A region's rate can change on a date (settings.taxRateChanges: region, from, rate). An invoice is
// taxed at its region's rate in force on its issue date (the latest change from on or before it,
// else the regional rate), so sending a draft, which makes it issued today, can change its tax. A
// credit note is taxed at the rate of the invoice it credits.
test.describe('dated tax rates', () => {
  test('taxes at the rate in force on the issue date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        taxRateChanges: [
          { region: 'NY', from: '2026-04-01', rate: 9.25 },
        ],
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-20', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-05', dueDate: '2026-04-30', creditOf: 2,
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-04-05', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // issued in March, before New York's rate went up to 9.25% on 2026-04-01: 8.875%
    await expect(page.getByTestId('invoice-tax')).toHaveText('$88.75');
    await page.getByTestId('invoice-send').click();
    // sending makes it issued today, so the new rate applies: 9.25% of 1,000.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$92.50');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,092.50');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number=INV-0000018 total=1092.50');
    // invoice 2 was issued on 2026-03-15 and keeps 8.875%; its credit note, issued in April, is
    // taxed like it: 8.875% of 200.00
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$88.75');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$17.75');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-total')).toHaveText('-$217.75');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$871.00'); // 1,088.75 - 217.75
    // California's rate has not changed
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$72.50');
  });
});
