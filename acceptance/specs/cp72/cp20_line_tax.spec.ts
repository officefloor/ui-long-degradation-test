import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp72 (mutates: [14, 19, 20, 29]): the invoice tax is now rounded once on the exact
// line taxes and shared over the lines, so the three 0.335 taxes come to $1.01 (0.34, 0.34, 0.33)
// instead of $1.02, and the discounted invoice's 4.275 + 5.225 to $9.50 (4.27 + 5.23). Carries both
// tests.
// Each taxable line's exact tax is the rate on its amount minus its discount share; the invoice tax is the lines' exact taxes added up and rounded once, half up to the cent; each line
// shows its share of it, split in proportion to the exact taxes by largest remainder.
// Exempt lines show $0.00.
test.describe('tax per line', () => {
  test('rounds tax on each line and adds the line taxes', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Badge', qty: 1, unitPrice: 3.35 },
            { id: 2, description: 'Lanyard', qty: 1, unitPrice: 3.35 },
            { id: 3, description: 'Pass', qty: 1, unitPrice: 3.35 },
            { id: 4, description: 'Postage', qty: 1, unitPrice: 5, taxExempt: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 3 x 0.335 = 1.005 -> 1.01, shared 33 cents each and the 2 left over to the lower ids
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.34');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.34');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.33');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.01');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$16.06'); // 3 x 3.35 + 5.00 = 15.05 + 1.01
  });

  test('taxes each line after its share of the discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 5,
          lineItems: [
            { id: 1, description: 'Workshop', qty: 1, unitPrice: 45 },
            { id: 2, description: 'Venue', qty: 1, unitPrice: 55 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // discount 5% of 100.00 = 5.00, split 45 : 55 -> 2.25 and 2.75
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$2.25');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$2.75');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$4.27'); // 4.275 of the 9.50: 427.5 cents -> 427
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$5.23'); // 522.5 -> 522, plus the spare cent (tied fractions, larger exact tax)
    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.50'); // 4.275 + 5.225 = 9.50 exactly
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$104.50'); // 100.00 - 5.00 + 9.50
  });
});
