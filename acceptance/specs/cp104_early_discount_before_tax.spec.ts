import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The early-payment discount is the client's percentage of the invoice's amount before tax (after
// its discounts), rounded down to the cent, no longer of the grand total; the amount that settles
// early is still the amount due minus that discount.
test.describe('early discount before tax', () => {
  test('the early discount is worked out before tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', earlyPayPct: 2, earlyPayDays: 10,
          region: 'NY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 4,
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 1,025.00 less the 4% discount (41.00) = 984.00 before tax; 2% of that is 19.68
    // (2% of the grand total would be 21.40)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,070.40');
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$1,050.72');
    await page.getByTestId('payment-form-amount').fill('1050.72');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-early-discount')).toHaveText('$19.68');
    await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount=19.68');
  });
});
