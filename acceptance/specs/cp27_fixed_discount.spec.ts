import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice discount can be a fixed amount (invoices[].discountAmount) instead of a percentage;
// setting one clears the other. A fixed discount can't be more than the subtotal, and it is split
// across the lines and taxed exactly like a percentage discount.
test.describe('fixed discount', () => {
  test('splits a fixed discount across the lines', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountAmount: 10,
          lineItems: [
            { id: 1, description: 'Strategy', qty: 1, unitPrice: 33.33 },
            { id: 2, description: 'Research', qty: 1, unitPrice: 33.33 },
            { id: 3, description: 'Report', qty: 1, unitPrice: 33.34 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00');
    // 1000 cents by 3333 : 3333 : 3334 (largest_remainder): 333.3, 333.3, 333.4 -> the cent to line 3
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$3.33');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$3.33');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$3.34');
    // every line is left with 30.00, taxed 3.00: 3 x 3.00 = 9.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$99.00'); // 100.00 - 10.00 + 9.00
  });

  test('one kind of discount replaces the other', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$8.00'); // 10% of 80.00
    await page.getByTestId('discount-form-pct').fill('');
    await page.getByTestId('discount-form-amount').fill('5');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$5.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$75.00'); // 80.00 - 5.00
    await page.getByTestId('discount-form-amount').fill('');
    await page.getByTestId('discount-form-pct').fill('20');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$16.00'); // 20% of 80.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$64.00'); // 80.00 - 16.00
  });

  test('refuses a fixed discount bigger than the subtotal', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('discount-form-pct').fill('');
    await page.getByTestId('discount-form-amount').fill('80.01');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$8.00'); // the 10% stays
  });
});
