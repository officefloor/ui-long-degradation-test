import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A draft invoice can carry a surcharge (invoices[].surchargePct, the surcharge box on the panel, 0
// to 25%): that percentage of the invoice's amount after its discounts, rounded down to the cent,
// shown on the panel. It is not discounted, it is taxed at the client's standard rate like the
// minimum charge, and it counts towards the minimum charge, which only tops up what is still short
// after it. A surcharge below 0, above 25% or on a sent invoice is refused.
test.describe('surcharge', () => {
  test('adds a percentage surcharge after the discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [{ id: 1, description: 'Design', qty: 4, unitPrice: 50 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          surchargePct: 10,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('surcharge-form-pct').fill('7.5');
    await page.getByTestId('surcharge-form-submit').click();
    // 200.00 less 10% = 180.00; 7.5% of that is 13.50, not discounted
    await expect(page.getByTestId('invoice-surcharge')).toHaveText('$13.50');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    // 8.875% of 180.00 + 13.50 = 193.50 is 17.173125
    await expect(page.getByTestId('invoice-tax')).toHaveText('$17.17');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$210.67'); // 193.50 + 17.17
    await expect(page.getByTestId('invoice-net')).toHaveText('$193.50');
    // the surcharge counts towards the minimum: 40.00 + 4.00 is topped up by 6.00 to 50.00
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-surcharge')).toHaveText('$4.00');
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$6.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$54.44');
  });

  test('refuses a surcharge out of range or on a sent invoice', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    for (const pct of ['25.01', '-1']) {
      await page.getByTestId('surcharge-form-pct').fill(pct);
      await page.getByTestId('surcharge-form-submit').click();
      await expect(page.getByTestId('surcharge-form-error')).toBeVisible();
    }
    await expect(page.getByTestId('invoice-surcharge')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('surcharge-form-pct').fill('5');
    await page.getByTestId('surcharge-form-submit').click();
    await expect(page.getByTestId('surcharge-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$108.88');
  });
});
