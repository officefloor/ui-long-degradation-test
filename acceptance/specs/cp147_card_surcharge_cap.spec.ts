import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The card surcharge on one payment is never more than the workspace cap
// (settings.cardSurchargeCap, in US dollars converted at the payment date's rate, rounded down);
// the rest of the payment pays invoices as usual.
test.describe('card surcharge cap', () => {
  test('caps the card surcharge', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        cardSurchargePct: 2.5,
        cardSurchargeCap: 15,
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1010 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('1025');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // 2.5% would be 25.00; the cap is 15.00, so 1,010.00 pays the invoice
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-surcharge')).toHaveText('$15.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$1,010.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // in euros the cap is 15 / 1.10 = 13.636, down to €13.63
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('1025');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-surcharge')).toHaveText('€13.63');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('€88.63'); // 1,100.00 - 1,011.37
    await expect.poll(() => auditLines()).toContain('CARD_SURCHARGE payment=2 amount=13.63');
    await page.getByTestId('client-row-1').click();
    // a small payment is under the cap: 102.50 is 100.00 + 2.50
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('102.50');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-row-3').getByTestId('payment-surcharge')).toHaveText('$2.50');
  });
});
