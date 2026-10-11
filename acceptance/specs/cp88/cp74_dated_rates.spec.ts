import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp88 (mutates: [61, 74, 79]): conversions now round down to the step, so the second
// payment (53.097) is CHF 53.05 instead of 53.10. Carries the test.
// Exchange rates can change over time: settings.fxRates lists dated rates (from a date, for a
// currency, the US dollars one unit is worth). Anything converted on a date — a payment in another
// currency, the late fee when it is charged, the dollar value of a small balance — uses the latest
// dated rate on or before that date, or the standing rate (settings.usdPer) before any.
test.describe('exchange rates by date', () => {
  test('converts at the rate in force on the payment date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        fxRates: [
          { from: '2026-03-01', currency: 'EUR', usdPer: 1.2 },
        ],
      },
      clients: [{ id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' }],
      invoices: [
        { id: 1, clientId: 5, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 5, amount: 50, date: '2026-02-25', currency: 'EUR',
          allocations: [{ invoiceId: 1, amount: 48.65 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-1').click();
    // paid 2026-02-25, before the 1.20 rate: 50 x 1.10 / 1.13 = 48.67 -> CHF 48.65
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('CHF 48.65');
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('50');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    // from 2026-03-01 a euro is worth $1.20: 50 x 1.20 / 1.13 = 53.097 -> down to CHF 0.05
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-allocated')).toHaveText('CHF 53.05');
    await expect(page.getByTestId('invoice-paid')).toHaveText('CHF 101.70'); // 48.65 + 53.05
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 98.30');
  });
});
