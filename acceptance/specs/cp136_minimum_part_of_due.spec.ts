import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A part payment must now bring at least 10% of what the invoice still owes (its amount due) to it,
// rather than 10% of its grand total, unless it settles it; what reaches the invoice is what
// counts, after any card surcharge or conversion fee.
test.describe('minimum part payment of what is due', () => {
  test('a part payment must be a tenth of what is still due', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { cardSurchargePct: 2.5 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 600, date: '2026-03-05', allocations: [{ invoiceId: 1, amount: 600 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 400.00 is still due: the minimum is 40.00 (a tenth of the 1,000.00 total would be 100.00)
    await page.getByTestId('payment-form-amount').fill('39.99');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await page.getByTestId('payment-form-amount').fill('40');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$360.00');
    // now a tenth of 360.00 = 36.00 must reach the invoice: 36.85 by card is only 35.95 after the surcharge
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('36.85');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('36.90');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$324.00'); // 360.00 - 36.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
