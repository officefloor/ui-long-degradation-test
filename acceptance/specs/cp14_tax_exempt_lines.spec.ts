import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A line can be tax exempt (lineItems[].taxExempt, a tick box on the line form). Tax is charged only
// on the taxable lines: each taxable line's amount minus its share of the discount, added up, at the
// workspace rate, rounded half up to the cent.
test.describe('tax-exempt lines', () => {
  test('charges tax only on taxable lines after their discount share', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 1, description: 'Consulting', qty: 1, unitPrice: 80 },
            { id: 2, description: 'Postage', qty: 1, unitPrice: 20, taxExempt: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00'); // 10% of 100.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$8.00'); // 10.00 x 80/100
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$2.00'); // 10.00 x 20/100
    // Only line 1 is taxed: 10% of (80.00 - 8.00) = 7.20
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.20');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$97.20'); // 100.00 - 10.00 + 7.20
  });

  test('adds an exempt line through the form', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Workshop', qty: 1, unitPrice: 12.25 },
            { id: 2, description: 'Workbook', qty: 1, unitPrice: 12.25 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.45'); // 10% of (12.25 + 12.25 = 24.50)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$26.95'); // 24.50 + 2.45

    await page.getByTestId('line-form-description').fill('Postage');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('7.50');
    await page.getByTestId('line-form-exempt').check();
    await page.getByTestId('line-form-submit').click();

    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$7.50');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$32.00'); // 24.50 + 7.50
    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.45'); // postage untaxed
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$34.45'); // 32.00 + 2.45
  });
});
