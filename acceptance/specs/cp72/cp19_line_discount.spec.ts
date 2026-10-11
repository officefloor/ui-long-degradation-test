import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp72 (mutates: [14, 19, 20, 29]): the invoice tax is now rounded once on the exact
// line taxes and shared over the lines, so 7.655 + 1.346 = 9.001 comes to $9.00 (grand total
// $99.01) instead of 7.66 + 1.35 = $9.01. Carries both tests; the line through the form has no tax.
// A line can carry its own percentage discount (lineItems[].discountPct, 0 to 100, up to two
// decimals): that percentage of the line's quantity x unit price (already rounded to the cent),
// rounded down to the cent, shown on the line; the line amount is shown after it. The subtotal
// adds the discounted line amounts, and the invoice discount, its split and the tax all work from
// them.
test.describe('line discount', () => {
  test('a line discount comes off before the invoice discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 1, description: 'Licences', qty: 3, unitPrice: 33.35, discountPct: 15 },
            { id: 2, description: 'Support', qty: 1, unitPrice: 14.96 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    const l1 = page.getByTestId('line-row-1');
    await expect(l1.getByTestId('line-discount')).toHaveText('$15.00'); // 15% of (3 x 33.35 = 100.05) = 15.0075 -> 15.00
    await expect(l1.getByTestId('line-amount')).toHaveText('$85.05'); // 100.05 - 15.00
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$14.96');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$100.01'); // 85.05 + 14.96
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00'); // 10% of 100.01 = 10.001 -> 10.00
    // split of 1000 cents by 85.05 : 14.96 (largest_remainder): 850.41 / 149.59 -> 850 + 150
    await expect(l1.getByTestId('line-discount-share')).toHaveText('$8.50');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$1.50');
    // 10% of 76.55 = 7.655 plus 10% of 13.46 = 1.346 is 9.001, rounded once to 9.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$99.01'); // 100.01 - 10.00 + 9.00
  });

  test('adds a discounted line through the form', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('12.50');
    await page.getByTestId('line-form-discount-pct').fill('20');
    await page.getByTestId('line-form-submit').click();
    const l2 = page.getByTestId('line-row-2');
    await expect(l2.getByTestId('line-discount')).toHaveText('$5.00'); // 20% of (2 x 12.50 = 25.00)
    await expect(l2.getByTestId('line-amount')).toHaveText('$20.00'); // 25.00 - 5.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$120.00'); // 100.00 + 20.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$120.00');
  });

  test('refuses a line discount over 100%', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('10');
    await page.getByTestId('line-form-discount-pct').fill('101');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);
  });
});
