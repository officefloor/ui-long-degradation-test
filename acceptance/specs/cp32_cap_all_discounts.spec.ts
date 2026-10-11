import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The discount cap limits everything taken off the invoice: line discounts plus the invoice discount,
// percentage or fixed. When together they would come to more than the cap, the invoice discount
// shrinks so the total equals the cap, never below zero.
test.describe('cap covers every discount', () => {
  test('the cap includes line discounts', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 5, discountCap: 25,
          lineItems: [
            { id: 1, description: 'Kit', qty: 1, unitPrice: 300, discountPct: 10 },
            { id: 2, description: 'Cables', qty: 1, unitPrice: 100 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10, discountCap: 20,
          lineItems: [
            { id: 3, description: 'Kit', qty: 1, unitPrice: 100, discountPct: 5 },
            { id: 4, description: 'Cables', qty: 1, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$370.00'); // (300.00 - 30.00) + 100.00
    // the 30.00 line discount alone is over the 25.00 cap, so no invoice discount (5% would be 18.50)
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$370.00');

    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$195.00'); // (100.00 - 5.00) + 100.00
    // 10% of 195.00 = 19.50, but only 20.00 - 5.00 = 15.00 is left under the cap
    await expect(page.getByTestId('invoice-discount')).toHaveText('$15.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$180.00'); // 195.00 - 15.00
  });
});
