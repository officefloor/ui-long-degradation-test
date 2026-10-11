import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A rate card entry can price its unit type in progressive tiers instead of one price
// (clients[].rates[].tiers: units in the band and unitPrice, the last band with no units for the
// rest): each band's units are charged at that band's price, like tax brackets, and the line's
// amount is the total, rounded to the cent (whole yen for yen clients); each line starts the bands
// from its first unit. The line is then discounted, taxed and totalled as usual, and a change of
// quantity reprices it.
test.describe('tiered rates', () => {
  test('prices a unit type in progressive tiers', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY',
          rates: [
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { units: 40, unitPrice: 15 }, { unitPrice: 12 }] },
            { unitType: 'hour', unitPrice: 95 },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 5,
          lineItems: [
            { id: 1, description: 'Licences', qty: 60, unitType: 'licence' },
            { id: 2, description: 'Licences', qty: 12.5, unitType: 'licence', discountPct: 10 },
            { id: 3, description: 'Setup', qty: 2, unitType: 'hour' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // the first 10 licences at 20.00, the next 40 at 15.00, the rest at 12.00:
    // 10 x 20.00 + 40 x 15.00 + 10 x 12.00 = 920.00 (all 60 at 12.00 would be 720.00)
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$920.00');
    // line 2: 10 x 20.00 + 2.5 x 15.00 = 237.50, less its own 10% (23.75)
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$213.75');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$190.00'); // 2 x 95.00
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$1,323.75');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$66.18'); // 5%, rounded down
    await expect(page.getByTestId('invoice-tax')).toHaveText('$111.61'); // 8.875% after the discount, rounded once
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,369.18');
  });

  test('reprices a tiered line when its quantity changes', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { units: 40, unitPrice: 15 }, { unitPrice: 12 }] },
            { unitType: 'hour', unitPrice: 95 },
          ] },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY',
          rates: [{ unitType: 'licence', tiers: [{ units: 100, unitPrice: 150 }, { unitPrice: 120.5 }] }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Licences', qty: 150, unitType: 'licence' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Licences');
    await page.getByTestId('line-form-unit-type').fill('licence');
    await page.getByTestId('line-form-qty').fill('25');
    await page.getByTestId('line-form-submit').click();
    // 10 x 20.00 + 15 x 15.00
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$425.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$577.50'); // (100.00 + 425.00) + 10%
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('55');
    await page.getByTestId('line-form-submit').click();
    // 10 x 20.00 + 40 x 15.00 + 5 x 12.00
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$860.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,056.00');
    // yen tiers: 100 x 150 + 50 x 120.5 = 21,025 yen
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('¥21,025');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('¥23,128');
  });
});
