import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Retention is worked out on the invoice's amount before tax (the subtotal minus the discount),
// still rounded down to the cent, instead of on the grand total. Everything that follows from it
// (the amount due, Retention held, the client's balance) uses that amount.
test.describe('retention before tax', () => {
  test('works retention out before tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('retention-form-pct').fill('5');
    await page.getByTestId('retention-form-submit').click();
    // 1,000.00 - 100.00 discount = 900.00 before tax (990.00 with tax): 5% of 900.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$990.00');
    await expect(page.getByTestId('invoice-retention')).toHaveText('$45.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$945.00'); // 990.00 - 45.00
    await page.getByTestId('payment-form-amount').fill('945.00');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Retention held');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$45.00');
  });
});
