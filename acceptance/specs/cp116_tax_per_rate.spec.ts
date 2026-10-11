import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The tax is worked out once for each rate: the exact taxes of the lines (and charges) at one rate
// are added up and rounded half up, and shared over those lines as before; the invoice tax is the
// total over the rates. For prices that include tax, a line's own rate is now used, and the lines
// at each rate are reconciled on their own (the tax inside their total, the missing cents to the
// largest of them).
test.describe('tax per rate', () => {
  test('works the tax out once for each rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', pricesIncludeTax: true },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Book', qty: 1, unitPrice: 22.5, taxRate: 5 },
            { id: 2, description: 'Design', qty: 1, unitPrice: 20.05 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 3, description: 'Design', qty: 1, unitPrice: 10 },
            { id: 4, description: 'Book', qty: 1, unitPrice: 10.5, taxRate: 5 },
            { id: 5, description: 'Pens', qty: 1, unitPrice: 1.13 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 5%: 1.125 -> 1.13; 10%: 2.005 -> 2.01; the invoice tax is 3.14 (one rounding of 3.13 would give 3.13)
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$1.13');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$2.01');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$3.14');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$45.69'); // 42.55 + 3.14
    // prices including tax: the 10% lines are reconciled together (10.00 and 1.13: 0.91 + 0.10, the
    // tax inside 11.13 is 11.13 - 10.12 = 1.01), the book at its own 5% (10.50 - 10.00 = 0.50)
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.91');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.50');
    await expect(page.getByTestId('line-row-5').getByTestId('line-tax')).toHaveText('$0.10');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.51');
    await expect(page.getByTestId('invoice-net')).toHaveText('$20.12');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$21.63');
  });
});
