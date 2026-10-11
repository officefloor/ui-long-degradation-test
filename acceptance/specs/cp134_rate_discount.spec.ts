import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have a discount on rates (clients[].rateDiscountPct, on the client form): every
// price a line takes from their rate card or the price list, each band's price included, is reduced
// by that percentage, rounded half up to the cent (whole yen) per unit, after conversion and before
// overtime. Prices typed on a line are not reduced.
test.describe('discount on rates', () => {
  test("takes the client's discount off their rates", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        rates: [
          { unitType: 'hour', unitPrice: 120 },
          { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { unitPrice: 15 }] },
        ],
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', rateDiscountPct: 7.5,
          rates: [{ unitType: 'hour', unitPrice: 95 }] },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY', rateDiscountPct: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 4, unitType: 'hour' },
            { id: 2, description: 'Licences', qty: 12, unitType: 'licence' },
            { id: 3, description: 'Support', qty: 2, unitPrice: 80, unitType: 'hour' },
            { id: 4, description: 'Night work', qty: 1, unitType: 'hour', overtime: true },
          ] },
        { id: 2, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Consulting', qty: 3, unitType: 'hour' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 7.5% off the card's 95.00 = 87.875 -> 87.88 an hour
    await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('$87.88');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$351.52'); // 4 x 87.88
    // price-list bands too: 20.00 -> 18.50 and 15.00 -> 13.875 -> 13.88; 10 x 18.50 + 2 x 13.88
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$212.76');
    // a price typed in is not discounted
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$160.00');
    // overtime on the discounted rate: 87.88 x 1.5 = 131.82
    await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('$131.82');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$941.71');
    // yen: $120.00 is 18,181 yen; 10% off is 16,362.9 -> 16,363
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-5').getByTestId('line-unit-price')).toHaveText('¥16,363');
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('¥49,089');
  });

  test('sets a rate discount when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        rates: [
          { unitType: 'hour', unitPrice: 120 },
          { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { unitPrice: 15 }] },
        ],
      },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-rate-discount-pct').fill('5');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Consulting');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-submit').click();
    // the price list's 120.00 less 5% = 114.00 an hour
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$228.00');
  });
});
