import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp88 (mutates: [61, 74, 79]): conversions now round down to the target currency's
// step, so €50 pays CHF 48.65 still but €100 pays ¥16,666 (not ¥16,667), leaving ¥3,334 due.
// Carries both tests.
// A payment can be made in another currency (payments[].currency, the payment form's currency; the
// client's own by default). It is converted into the client's currency through US dollars at the
// workspace rates: amount x (dollars per unit paid) / (dollars per unit of the client's currency),
// rounded down to the client's currency step (whole yen, CHF 0.05, otherwise the cent). The
// converted amount is what is applied and checked (amount due, minimum part payment, write-off,
// credit held) and is what PAYMENT_RECORDED shows; the payment row shows the amount in the currency
// paid and the part applied in the client's currency.
test.describe('payments in another currency', () => {
  test('converts a payment in another currency through dollars', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 5, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 48.7 }] },
        { id: 2, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 20000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('50');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 50 x 1.10 / 1.13 = 48.6725... rounded down to CHF 0.05
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('€50.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('CHF 48.65');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=48.65');
    // CHF 0.05 left, worth about $0.06: written off
    await expect(page.getByTestId('invoice-written-off')).toHaveText('CHF 0.05');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');

    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 100 x 1.10 / 0.0066 = 16,666.67 -> whole yen
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-allocated')).toHaveText('¥16,666');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('¥3,334');
    await expect(page.getByTestId('client-row-3').getByTestId('client-balance')).toHaveText('¥3,334');
  });

  test('checks and holds credit on the converted amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 150 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('payment-form-currency').selectOption('GBP');
    await page.getByTestId('payment-form-amount').fill('80');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 80 x 1.25 = 100.00, of the 150.00 due
    await expect(page.getByTestId('invoice-paid')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('£80.00');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('payment-form-currency').selectOption('JPY');
    await page.getByTestId('payment-form-amount').fill('10000');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 10,000 x 0.0066 / 1.10 = €60.00: €50.00 pays the invoice, €10.00 is held as credit
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-amount')).toHaveText('¥10,000');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=10.00');
    await expect(page.getByTestId('client-row-2').getByTestId('client-credit')).toHaveText('€10.00');
  });
});
