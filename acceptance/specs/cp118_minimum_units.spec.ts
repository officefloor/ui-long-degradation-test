import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A rate card entry can have minimum units (clients[].rates[].minUnits): a line of that unit type
// is billed at least that many units, after rounding up to its increment. The billed quantity shows
// it, and the line is priced and counted through the tiers on it.
test.describe('minimum units', () => {
  test('bills at least the minimum units of a unit type', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'callout', unitPrice: 85, increment: 0.5, minUnits: 2 },
            { unitType: 'licence', minUnits: 5, tiers: [{ units: 10, unitPrice: 20 }, { unitPrice: 15 }] },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Call-out', qty: 0.4, unitType: 'callout' },
            { id: 2, description: 'Call-out', qty: 3.2, unitType: 'callout', discountPct: 10 },
            { id: 3, description: 'Licences', qty: 3, unitType: 'licence' },
            { id: 4, description: 'Licences', qty: 9, unitType: 'licence' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 0.4 of a call-out is 0.5 in half steps, but a call-out is at least 2: billed 2 x 85.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-billed-qty')).toHaveText('2');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$170.00');
    // 3.2 -> 3.5 x 85.00 = 297.50, less its own 10%
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$267.75');
    // 3 licences are billed as the minimum 5 (units 1-5 at 20.00); the next line's 9 are units 6-14:
    // 5 x 20.00 + 4 x 15.00 = 160.00
    await expect(page.getByTestId('line-row-3').getByTestId('line-billed-qty')).toHaveText('5');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$160.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$767.53');
    // 7 licences are over the minimum: units 1-7, so the other line moves to units 8-16
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('7');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$140.00'); // 7 x 20.00
    // 3 x 20.00 + 6 x 15.00
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$150.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$800.53');
  });
});
