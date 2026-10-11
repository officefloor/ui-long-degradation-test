import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Withholding only applies to invoices whose amount before tax is at least the workspace threshold
// (settings.withholdingThreshold, in US dollars converted at the issue date's rate, rounded down);
// below it nothing is withheld and the client pays the whole invoice.
test.describe('withholding threshold', () => {
  test('withholds only from the threshold up', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        withholdingThreshold: 500,
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', withholdingPct: 10 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR', withholdingPct: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 2, description: 'Design', qty: 1, unitPrice: 450 },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 50 },
          ] },
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 450 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 460 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 400.00 before tax is under the 500.00 threshold: nothing withheld
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$440.00');
    // 500.00 reaches it: 10% withheld
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$500.00'); // 550.00 - 50.00
    // removing the hosting line takes it back under
    await page.getByTestId('line-row-3').getByTestId('line-remove').click();
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$495.00');
    // in euros the threshold is 500 / 1.10 = 454.5454, down to €454.54
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-withholding')).toHaveText('€0.00');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-withholding')).toHaveText('€46.00');
  });
});
