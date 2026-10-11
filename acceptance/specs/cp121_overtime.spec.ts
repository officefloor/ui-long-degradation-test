import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A line can be overtime (lineItems[].overtime, a box on the line form): its unit price, from the
// card, the price list or typed in, is 1.5 times the price, rounded half up to the cent; for a
// tiered unit type each band's price is, and overtime units count through the bands with the
// others. The line is then discounted, taxed and totalled as usual.
test.describe('overtime', () => {
  test('charges overtime at time and a half', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'hour', unitPrice: 95 },
            { unitType: 'visit', tiers: [{ units: 2, unitPrice: 80 }, { unitPrice: 60 }] },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 5,
          lineItems: [
            { id: 1, description: 'Visits', qty: 3, unitType: 'visit' },
            { id: 2, description: 'Weekend visits', qty: 2, unitType: 'visit', overtime: true },
            { id: 3, description: 'Support', qty: 1, unitPrice: 33.33, overtime: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // visits 1-3: 2 x 80.00 + 60.00 = 220.00; the weekend visits are units 4-5 at 60.00 x 1.5 = 90.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$220.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$180.00');
    // 33.33 x 1.5 = 49.995, a unit price of 50.00
    await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('$50.00');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$22.50'); // 5% of 450.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$470.25');
    await page.getByTestId('line-form-description').fill('Night work');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('2.25');
    await page.getByTestId('line-form-overtime').check();
    await page.getByTestId('line-form-submit').click();
    // 95.00 x 1.5 = 142.50 an hour; 2.25 x 142.50 = 320.625
    await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('$142.50');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$320.63');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$805.31');
  });
});
