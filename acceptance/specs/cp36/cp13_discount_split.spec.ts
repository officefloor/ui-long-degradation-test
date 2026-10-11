import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp36 (mutates: [13]): tied leftover fractions now go to the larger line first, then the
// lower id. In the four-line invoice lines 2, 3 and 4 tie, so the two cents go to lines 4 and 3
// (1.84, 2.32, 4.34) instead of 2 and 3. The equal-amount invoice is unchanged. Carries both tests.
// The invoice discount is spread over the lines in proportion to their amounts, in cents: each line
// first gets the whole cents of its exact share (rounded down), then the cents left over go one each
// to the lines with the largest leftover fractions; equal fractions go to the larger line amount,
// then the lower line id. Each line shows its share and the shares add up exactly to the discount.
// Shares computed with largest_remainder (acceptance/reference/algorithms.py), ties re-ordered by
// amount (scratch lr_revised, equal to the reference whenever no remainders tie).
test.describe('discount split across lines', () => {
  test('shares a discount evenly with the leftover cent to the lowest line', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 16.67,
          lineItems: [
            { id: 1, description: 'Plan A', qty: 1, unitPrice: 20 },
            { id: 2, description: 'Plan B', qty: 1, unitPrice: 20 },
            { id: 3, description: 'Plan C', qty: 1, unitPrice: 20 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00'); // 16.67% of 60.00 = 10.002 -> 10.00
    // 1000 cents / 3 = 333 each, remainders and amounts tie, the 1 cent left goes to line 1
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$3.34');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$3.33');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$3.33');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$50.00'); // 60.00 - 10.00
  });

  test('gives the leftover cents to the largest remainders', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 1, description: 'Setup', qty: 2, unitPrice: 7.51 },
            { id: 2, description: 'Training', qty: 1, unitPrice: 18.46 },
            { id: 3, description: 'Licences', qty: 4, unitPrice: 5.79 },
            { id: 4, description: 'Support', qty: 1, unitPrice: 43.36 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // Lines 15.02 + 18.46 + 23.16 + 43.36 = 100.00; 10% = 10.00
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00');
    // Exact shares 150.2, 184.6, 231.6, 433.6 cents: 998 whole cents, 2 left over; lines 2, 3 and 4
    // tie on .6, so the two largest of them, line 4 (43.36) and line 3 (23.16), get them.
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$1.50');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$1.84');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$2.32');
    await expect(page.getByTestId('line-row-4').getByTestId('line-discount-share')).toHaveText('$4.34');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$90.00'); // 100.00 - 10.00
  });
});
