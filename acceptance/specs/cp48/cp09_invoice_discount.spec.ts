import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp48 (mutates: [9]): percentage discounts now round down to the cent, so 12.5% of
// 101.00 takes off $12.62 (grand total $88.38) instead of $12.63 ($88.37). Carries all three tests.
// A draft invoice can take a percentage discount (0 to 100, up to two decimals): that percentage of
// the subtotal, rounded down to the cent, shown as the amount taken off and taken off the grand
// total and the list total. A percentage outside 0 to 100 is refused with an error.
test.describe('invoice discount', () => {
  test('takes a seeded percentage off the subtotal', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 12.5,
          lineItems: [{ id: 1, description: 'Licences', qty: 4, unitPrice: 25.25 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$101.00'); // 4 x 25.25
    // 12.5% of 101.00 = 12.625 -> 12.62 (rounded down)
    await expect(page.getByTestId('invoice-discount')).toHaveText('$12.62');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$88.38'); // 101.00 - 12.62
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$88.38');
  });

  test('applies a discount I enter', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 45 }, { id: 2, description: 'Hosting', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    await page.getByTestId('discount-form-pct').fill('15');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$15.00'); // 15% of (2 x 45 + 10 = 100.00)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$85.00'); // 100.00 - 15.00
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('$85.00');
  });

  test('refuses a percentage outside 0 to 100', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 45 }, { id: 2, description: 'Hosting', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    for (const pct of ['120', '-5', '10.125']) {
      await page.getByTestId('discount-form-pct').fill(pct);
      await page.getByTestId('discount-form-submit').click();
      await expect(page.getByTestId('discount-form-error')).toBeVisible();
      await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    }
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$100.00'); // 2 x 45 + 10
  });
});
