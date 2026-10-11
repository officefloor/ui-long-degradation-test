import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The workspace has a price list (settings.rates: unitType with unitPrice or tiers, in US dollars).
// A line with a unit type the client's own card does not have, and no price of its own, is priced
// from the price list, each price (or band price) converted to the client's currency at the
// invoice's issue-date rate and rounded down to its step. A unit type on neither is refused.
test.describe('workspace price list', () => {
  test('falls back to the workspace price list, converted', { tag: '@core' }, async ({ page }) => {
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
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', rates: [{ unitType: 'hour', unitPrice: 95 }] },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 2, unitType: 'hour' },
            { id: 2, description: 'Licences', qty: 12, unitType: 'licence' },
          ] },
        { id: 2, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Consulting', qty: 3, unitType: 'hour' }] },
        { id: 3, clientId: 5, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 4, description: 'Consulting', qty: 2.5, unitType: 'hour' },
            { id: 5, description: 'Licences', qty: 12, unitType: 'licence' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // Acme's own card has hours (95.00); licences come from the price list: 10 x 20.00 + 2 x 15.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$190.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$230.00');
    // in yen: $120.00 / 0.0066 = 18,181.8, rounded down to 18,181 an hour
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('¥18,181');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('¥54,543'); // 3 x 18,181
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('¥59,997');
    // in Swiss francs: 120 / 1.13 = 106.19, down to CHF 106.15; 2.5 x 106.15 = 265.375 -> 265.38;
    // each band converted: 20 / 1.13 = 17.699 -> 17.65, 15 / 1.13 = 13.274 -> 13.25
    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('CHF 106.15');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('CHF 265.38');
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('CHF 203.00'); // 10 x 17.65 + 2 x 13.25
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('CHF 515.22');
  });
});
