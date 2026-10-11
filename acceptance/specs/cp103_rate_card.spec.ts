import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have a rate card (clients[].rates: unitType and unitPrice). A line can have a unit
// type (lineItems[].unitType, the line form's unit type box, shown on the line); with no unit price
// of its own it is priced at the client's rate for that unit type, shown as its unit price, and
// then discounted, taxed and totalled like any line. A price entered on the line wins over the
// card. A line with no price whose unit type is not on the client's card is refused.
test.describe('rate card', () => {
  test("prices a line from the client's rate card", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [{ unitType: 'hour', unitPrice: 95 }, { unitType: 'day', unitPrice: 680 }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 5,
          lineItems: [
            { id: 1, description: 'Consulting', qty: 7.5, unitType: 'hour' },
            { id: 2, description: 'Workshop', qty: 2, unitType: 'day', discountPct: 10 },
            { id: 3, description: 'Travel', qty: 1, unitPrice: 120.4 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('$95.00');
    await expect(page.getByTestId('line-row-1').getByTestId('line-unit-type')).toHaveText('hour');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$712.50'); // 7.5 x 95.00
    await expect(page.getByTestId('line-row-2').getByTestId('line-unit-price')).toHaveText('$680.00');
    // 2 x 680.00 = 1,360.00 less its own 10% (136.00)
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$1,224.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$2,056.90'); // 712.50 + 1,224.00 + 120.40
    await expect(page.getByTestId('invoice-discount')).toHaveText('$102.84'); // 5% of 2,056.90, rounded down
    await expect(page.getByTestId('invoice-tax')).toHaveText('$195.41');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$2,149.47');
  });

  test('adds a line by unit type', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [{ unitType: 'hour', unitPrice: 95 }, { unitType: 'day', unitPrice: 680 }] },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // no unit price: the card's 95.00 an hour
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('3');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('$95.00');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$285.00');
    // a price typed in wins over the card
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('80');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$160.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$599.50'); // (100.00 + 285.00 + 160.00) + 10%
    // a unit type the card does not have, with no price, is refused
    await page.getByTestId('line-form-description').fill('Retainer');
    await page.getByTestId('line-form-unit-type').fill('week');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(3);
    // Globex has no rate card
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$110.00');
  });
});
