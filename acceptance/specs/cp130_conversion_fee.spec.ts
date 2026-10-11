import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment in a currency other than the client's loses the workspace's conversion fee
// (settings.fxFeePct): that percentage of the converted amount, rounded half up to the client's
// currency (whole yen), shown on the payment row and written as FX_FEE payment=<id> amount=<fee>.
// Only the rest pays invoices or is held as credit; a card payment loses its card surcharge, worked
// out on the converted amount, as well.
test.describe('conversion fee', () => {
  test('takes a conversion fee off a payment in another currency', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        fxFeePct: 1.5,
        cardSurchargePct: 2.5,
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 5, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 20000 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // 100 x 1.10 / 1.13 = 97.345, down to CHF 97.30; 1.5% of that is 1.4595 -> 1.46; 95.84 is applied
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-fx-fee')).toHaveText('CHF 1.46');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('CHF 95.84');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 4.16');
    await expect.poll(() => auditLines()).toContain('FX_FEE payment=1 amount=1.46');
    // $100 for yen: 100 / 0.0066 = 15,151.5, down to 15,151; 1.5% = 227.265 -> 227; 14,924 applied
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-currency').selectOption('USD');
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-fx-fee')).toHaveText('¥227');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('¥5,076');
    // €100 by card for a dollar client: $110.00 converted; the 1.65 fee and the 2.68 card surcharge
    // (110 - 110 / 1.025 = 2.68) both come off it, leaving 105.67 to pay the invoice
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-row-3').getByTestId('payment-fx-fee')).toHaveText('$1.65');
    await expect(page.getByTestId('payment-row-3').getByTestId('payment-surcharge')).toHaveText('$2.68');
    await expect(page.getByTestId('payment-row-3').getByTestId('payment-allocated')).toHaveText('$105.67');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$94.33');
  });
});
