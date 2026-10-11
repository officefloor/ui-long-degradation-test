import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An adjustment note for a client in another currency converts anything priced in US dollars at its
// invoice's date rate, like the invoice's own lines, and its exchange difference on payments is
// measured from that rate too.
test.describe('adjustment notes in another currency', () => {
  test("a note is converted at its invoice's rate and its exchange difference measured from it", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: {
        taxRate: 10,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        fxRates: [
          { from: '2026-06-01', currency: 'EUR', usdPer: 1.2 },
        ],
        rates: [
          { unitType: 'day', unitPrice: 660 },
        ],
      },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' }],
      invoices: [
        { id: 1, clientId: 2, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Workshop', qty: 1, unitType: 'day' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Workshop');
    await page.getByTestId('line-form-unit-type').fill('day');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-submit').click();
    // the price list's 660.00 US dollars at the invoice's rate of 1.10: €600.00 (today's 1.20 would give €550.00)
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-2').getByTestId('line-unit-price')).toHaveText('€600.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€660.00');
    await page.getByTestId('payment-form-amount').fill('660');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // paid today at 1.20: 660.00 x (1.20 - 1.10) = 66.00 US dollars of exchange difference
    await expect(page.getByTestId('invoice-fx-difference')).toHaveText('$66.00');
    await expect.poll(() => auditLines()).toContain('FX_DIFFERENCE id=2 payment=1 amount=66.00');
  });
});
