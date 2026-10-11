import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A rate card entry can have an increment (clients[].rates[].increment, e.g. 0.25 of an hour or a
// pack of 5). Any line of that unit type is billed on its quantity rounded up to the next whole
// increment, shown as the line's billed quantity next to the quantity entered; the line is priced,
// and counted through the tiers, on the billed quantity.
test.describe('billing increments', () => {
  test('bills a unit type in whole increments', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'hour', unitPrice: 95, increment: 0.25 },
            { unitType: 'licence', increment: 5, tiers: [{ units: 10, unitPrice: 20 }, { units: 40, unitPrice: 15 }, { unitPrice: 12 }] },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 1.6, unitType: 'hour' },
            { id: 2, description: 'Support', qty: 2, unitPrice: 80, unitType: 'hour', discountPct: 10 },
            { id: 3, description: 'Licences', qty: 12, unitType: 'licence' },
            { id: 4, description: 'Licences', qty: 7, unitType: 'licence' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // hours go in quarters: 1.6 is billed as 1.75 hours, 1.75 x 95.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-billed-qty')).toHaveText('1.75');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$166.25');
    // even at its own price: 2 hours is already whole quarters, 2 x 80.00 less 10%
    await expect(page.getByTestId('line-row-2').getByTestId('line-billed-qty')).toHaveText('2');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$144.00');
    // licences go in packs of 5: 12 -> 15 (10 x 20.00 + 5 x 15.00), then 7 -> 10 carries on at 15.00
    await expect(page.getByTestId('line-row-3').getByTestId('line-billed-qty')).toHaveText('15');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$275.00');
    await expect(page.getByTestId('line-row-4').getByTestId('line-billed-qty')).toHaveText('10');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$150.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$808.78');
    // a six-minute call is a quarter of an hour
    await page.getByTestId('line-form-description').fill('Call');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('0.1');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-5').getByTestId('line-qty')).toHaveText('0.1');
    await expect(page.getByTestId('line-row-5').getByTestId('line-billed-qty')).toHaveText('0.25');
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('$23.75'); // 0.25 x 95.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$834.90');
  });
});
