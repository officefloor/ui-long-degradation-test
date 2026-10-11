import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An invoice of a client billed in another currency shows its exchange difference in US dollars:
// for each payment applied to it, the applied amount's dollar value at the rate on the payment date
// minus its dollar value at the rate on the invoice's issue date, each rounded half up to the cent,
// added up (a loss is negative). Recording a payment on such an invoice writes FX_DIFFERENCE
// id=<invoice id> payment=<payment id> amount=<that payment's difference>.
test.describe('exchange difference', () => {
  test('shows the exchange difference on a foreign invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        fxRates: [
          { from: '2026-03-01', currency: 'EUR', usdPer: 1.2 },
          { from: '2026-04-01', currency: 'EUR', usdPer: 1.05 },
        ],
      },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' }],
      invoices: [
        { id: 1, clientId: 2, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 500 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-03-10', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 2, amount: 200, date: '2026-02-20', allocations: [{ invoiceId: 1, amount: 200 }] },
        { id: 2, clientId: 2, amount: 100, date: '2026-03-05', allocations: [{ invoiceId: 1, amount: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-1').click();
    // issued at $1.10 a euro: €200 paid at 1.10 makes no difference; €100 paid at 1.20 is a $10.00 gain
    await expect(page.getByTestId('invoice-fx-difference')).toHaveText('$10.00');
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('payment-form-amount').fill('50');
    await page.getByTestId('payment-form-date').fill('2026-04-05');
    await page.getByTestId('payment-form-submit').click();
    // issued at 1.20, paid at 1.05: 50 x 1.05 - 50 x 1.20 = -7.50
    await expect(page.getByTestId('invoice-fx-difference')).toHaveText('-$7.50');
    await expect.poll(() => auditLines()).toContain('FX_DIFFERENCE id=2 payment=3 amount=-7.50');
  });
});
