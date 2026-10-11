import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp116 (mutates: [72, 101, 106]): the tax is now rounded once per rate, not once over
// the invoice; both tests' figures still hold, and a new test shows a 5% line and a 10% line coming
// to 1.13 + 2.01 = 3.14 where a single rounding gave 3.13. Carries both tests.
// The invoice's tax is worked out once per rate: the exact taxes (rate on amount minus discount
// share, unrounded) of the lines at each rate are added up and rounded half up to the cent, and the
// invoice tax is the total over the rates. Each line shows its share of its
// rate's tax, split in proportion to the lines' exact taxes like the discount split
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
    // 5% of 10.10 = 0.505 -> 0.51; 10% of 20.05 = 2.005 plus 10% of 0.15 = 0.015 is 2.02; 2.53
    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.53');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.51');
    await expect(page.getByTestId('line-row-5').getByTestId('line-tax')).toHaveText('$2.01');
    await expect(page.getByTestId('line-row-6').getByTestId('line-tax')).toHaveText('$0.01');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$32.83');
  });

  test('rounds each rate on its own', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Book', qty: 1, unitPrice: 22.5, taxRate: 5 },
            { id: 2, description: 'Design', qty: 1, unitPrice: 20.05 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    // 5% of 22.50 = 1.125 -> 1.13 and 10% of 20.05 = 2.005 -> 2.01: 3.14, not 3.13
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$1.13');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$2.01');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$3.14');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$45.69');
  });
});
