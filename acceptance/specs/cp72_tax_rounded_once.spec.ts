import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The invoice's tax is worked out once: every line's exact tax (its rate on its amount minus its
// discount share, unrounded) is added up and the total rounded half up to the cent. Each line shows
// its share of that tax, split in proportion to the lines' exact taxes like the discount split
// (whole cents first, leftover cents to the largest remainders; ties to the larger exact tax, then
// the lower line id), so the line taxes add up exactly to the invoice tax.
test.describe('tax rounded once', () => {
  test('rounds the invoice tax once and shares it over the lines', { tag: '@core' }, async ({ page }) => {
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
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 4, description: 'Book', qty: 1, unitPrice: 10.1, taxRate: 5 },
            { id: 5, description: 'Course', qty: 1, unitPrice: 20.05 },
            { id: 6, description: 'Pen', qty: 1, unitPrice: 0.15 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 3 x 0.335 = 1.005 -> 1.01 (rounding each line would give 1.02); shared 101 cents over equal
    // exact taxes: 33 each, the 2 left over to the lower ids
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.01');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.34');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.34');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.33');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$11.06');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    // exact: 5% of 10.10 = 0.505, 10% of 20.05 = 2.005, 10% of 0.15 = 0.015; total 2.525 -> 2.53
    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.53');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.51');
    await expect(page.getByTestId('line-row-5').getByTestId('line-tax')).toHaveText('$2.01');
    await expect(page.getByTestId('line-row-6').getByTestId('line-tax')).toHaveText('$0.01');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$32.83');
  });
});
