import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A line can be billed by percent complete (lineItems[].percentComplete, more than 0 and at most
// 100; the line form's percent box, shown on the line as e.g. "40%"): its amount is that percentage
// of its full amount (quantity x its price, whether typed, from the card or the price list),
// rounded half up to the cent, before its own discount, the invoice discount, tax and totals. Other
// values are refused.
test.describe('percent complete', () => {
  test('bills a line by its percent complete', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 5000 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [{ unitType: 'day', unitPrice: 1234.56 }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 12000, percentComplete: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-percent')).toHaveText('40%');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$4,800.00'); // 40% of 12,000.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$4,752.00'); // 4,800.00 - 10% + 10% tax
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-unit-type').fill('day');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-percent').fill('33.3');
    await page.getByTestId('line-form-submit').click();
    // 33.3% of the card's 1,234.56 a day = 411.10848, rounded half up
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$411.11');
    // the 10% invoice discount comes off the typed-in line only (card prices take none)
    await expect(page.getByTestId('invoice-discount')).toHaveText('$480.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$5,204.22');
    // over the 5,000.00 limit now
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('line-form-description').fill('Testing');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('900');
    await page.getByTestId('line-form-percent').fill('100');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$1,800.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$6,986.22');
    // nothing done, or more than all of it, is refused
    await page.getByTestId('line-form-description').fill('Testing');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('900');
    await page.getByTestId('line-form-percent').fill('0');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await page.getByTestId('line-form-description').fill('Testing');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('900');
    await page.getByTestId('line-form-percent').fill('120');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(3);
  });
});
