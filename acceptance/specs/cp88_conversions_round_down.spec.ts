import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every conversion between currencies (payments and refunds in another currency, the late fee)
// still goes through US dollars, but is rounded down to the target currency's step (whole yen, CHF
// 0.05, the cent) instead of half up, so a client is never credited more than was received.
test.describe('conversions round down', () => {
  test('rounds a conversion down to the step', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 5, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 20000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('49');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 49 x 1.10 / 1.13 = 47.699: down to CHF 47.65 (half up would give 47.70)
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('CHF 47.65');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 52.35');
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 100 x 1.10 / 0.0066 = 16,666.67: down to 16,666 yen
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-allocated')).toHaveText('¥16,666');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('¥3,334');
  });
});
