import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A plan is refused when its monthly instalment would be worth less than $25.00 at today's rates.
test.describe('minimum instalment', () => {
  test('refuses a plan whose instalment is worth under $25', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Licence', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Licence', qty: 1, unitPrice: 20000 }] },
      ],
    });
    await page.goto('/');

    // 100.00 over 6 at 0%: 16.67, rounded up to 17.00, worth under $25
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('plan-form-count').fill('6');
    await page.getByTestId('plan-form-rate').fill('0');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('plan-form-error')).toBeVisible();
    // €100.00 over 4: €25.00, worth 25 x 1.10 = $27.50
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('plan-form-count').fill('4');
    await page.getByTestId('plan-form-rate').fill('0');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('€25.00');
    // 20,000 yen over 6: 3,334 yen, worth 3,334 x 0.0066 = $22.00
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('plan-form-count').fill('6');
    await page.getByTestId('plan-form-rate').fill('0');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('plan-form-error')).toBeVisible();
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
  });
});
