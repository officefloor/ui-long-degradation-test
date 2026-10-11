import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Tax is worked out line by line: each taxable line's tax is the rate on its amount minus its
// discount share, rounded half up to the cent, shown on the line (exempt lines show $0.00). The
// invoice tax is the sum of the line taxes.
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
    for (const id of [1, 2, 3]) {
      // 10% of 3.35 = 0.335 -> 0.34
      await expect(page.getByTestId(`line-row-${id}`).getByTestId('line-tax')).toHaveText('$0.34');
    }
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.00');
    // 3 x 0.34 = 1.02 (one rounding of 10% of 10.05 would give 1.01)
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.02');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$16.07'); // 3 x 3.35 + 5.00 = 15.05 + 1.02
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
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$4.28'); // 10% of 42.75 = 4.275 -> 4.28
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$5.23'); // 10% of 52.25 = 5.225 -> 5.23
    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.51'); // 4.28 + 5.23 (10% of 95.00 would be 9.50)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$104.51'); // 100.00 - 5.00 + 9.51
  });
});
