import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A unit type priced in tiers counts all of the invoice's lines of that unit type together: lines
// are taken in line order (lower id first), each carrying on through the bands from where the line
// before it stopped, and each line's amount is the exact charge for its own units, rounded to the
// cent. Adding, changing or removing one of them reprices the others.
test.describe('tiers across lines', () => {
  test("counts a unit type's tiers over all its lines", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { units: 40, unitPrice: 15 }, { unitPrice: 12 }] },
            { unitType: 'hour', unitPrice: 95 },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Licences', qty: 8, unitType: 'licence' },
            { id: 2, description: 'Licences', qty: 5, unitType: 'licence' },
            { id: 3, description: 'Licences', qty: 40, unitType: 'licence' },
            { id: 4, description: 'Setup', qty: 1, unitType: 'hour' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // units 1-8 at 20.00 = 160.00; units 9-13: 2 x 20.00 + 3 x 15.00 = 85.00;
    // units 14-53: 37 x 15.00 + 3 x 12.00 = 591.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$160.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$85.00');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$591.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,024.10'); // (836.00 + 95.00) + 10%
    // without the first line the others move down the bands: units 1-5 = 100.00, units 6-45:
    // 5 x 20.00 + 35 x 15.00 = 625.00
    await page.getByTestId('line-row-1').getByTestId('line-remove').click();
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$625.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$902.00');
  });
});
