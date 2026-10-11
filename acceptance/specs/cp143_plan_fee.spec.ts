import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Setting up an instalment plan adds the workspace plan fee (settings.planFee, in US dollars
// converted at the issue date's rate, rounded down), shown on the panel, to the amount spread over
// the instalments (after any down payment): it earns the plan's interest and is part of the plan
// total, the payoff and the minimum instalment check.
test.describe('instalment plan fee', () => {
  test('adds the plan fee to what is spread over the instalments', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 }, planFee: 30 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('plan-form-count').fill('3');
    await page.getByTestId('plan-form-rate').fill('12');
    await page.getByTestId('plan-form-down').fill('10');
    await page.getByTestId('plan-form-submit').click();
    // down payment 10% of 1,000.00 = 100.00; then 900.00 + the 30.00 fee = 930.00 over 3 at 12%:
    // 930 x 0.01 / (1 - 1.01^-3) = 316.22, rounded up to 317.00
    await expect(page.getByTestId('invoice-plan-fee')).toHaveText('$30.00');
    await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-payment')).toHaveText('$100.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$317.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$9.30');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$314.64');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,048.64');
    // in euros the fee is 30 / 1.10 = 27.27: 1,027.27 over 2 is 513.635, rounded up to 514.00
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('plan-form-count').fill('2');
    await page.getByTestId('plan-form-rate').fill('0');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('invoice-plan-fee')).toHaveText('€27.27');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('€514.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('€513.27');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('€1,027.27');
  });
});
