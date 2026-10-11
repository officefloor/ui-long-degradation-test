import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp32 (mutates: [29]): the cap now limits line discounts plus the invoice discount,
// fixed or percentage, so the invoice with a 20.00 line discount gets 10.00 off (not 20.00) and the
// 50.00 fixed discount is capped at 25.00. Carries all four tests.
// An invoice can have a discount cap (invoices[].discountCap, entered with the discount): line
// discounts plus the invoice discount, percentage or fixed, never come to more than the cap; the
// invoice discount shrinks to fit. The capped discount is split and taxed as usual.
test.describe('discount cap', () => {
  test('caps a percentage discount at the maximum', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10, discountCap: 25,
          lineItems: [
            { id: 1, description: 'Platform', qty: 1, unitPrice: 300 },
            { id: 2, description: 'Onboarding', qty: 1, unitPrice: 100 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10, discountCap: 60,
          lineItems: [{ id: 3, description: 'Platform', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$25.00'); // 10% of 400.00 = 40.00, capped at 25.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$18.75'); // 25.00 x 300/400
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$6.25'); // 25.00 x 100/400
    // 10% of 281.25 = 28.125 -> 28.13; 10% of 93.75 = 9.375 -> 9.38; 28.13 + 9.38 = 37.51
    await expect(page.getByTestId('invoice-tax')).toHaveText('$37.51');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$412.51'); // 400.00 - 25.00 + 37.51
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-discount')).toHaveText('$40.00'); // 10% of 400.00, under the 60.00 cap
  });

  test('caps alongside line discounts', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10, discountCap: 30,
          lineItems: [
            { id: 1, description: 'Kit', qty: 1, unitPrice: 200, discountPct: 10 },
            { id: 2, description: 'Cables', qty: 1, unitPrice: 20 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00'); // (200.00 - 20.00) + 20.00
    // 10% of 200.00 = 20.00, but the 20.00 line discount leaves only 30.00 - 20.00 = 10.00 under the cap
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$190.00'); // 200.00 - 10.00
  });

  test('caps alongside a fixed discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountAmount: 50, discountCap: 25,
          lineItems: [{ id: 1, description: 'Kit', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$25.00'); // the 50.00 fixed amount, capped
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$275.00'); // 300.00 - 25.00
  });

  test('sets a cap through the form', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Platform', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-cap').fill('25');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$25.00'); // 10% of 400.00 = 40.00, capped
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$375.00'); // 400.00 - 25.00
  });
});
