import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// With a client selected, the rate form (unit type and price) adds a rate to their card or replaces
// the one for that unit type. Lines of the client's draft invoices priced from the card are
// repriced straight away; a sent invoice keeps the prices it was sent with (sending stores each
// card price on its line). A rate needs a unit type and a price above zero with at most two
// decimals.
test.describe('editing the rate card', () => {
  test('changing a rate reprices drafts but not sent invoices', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', rates: [{ unitType: 'hour', unitPrice: 95 }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Consulting', qty: 2, unitType: 'hour' }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 2, description: 'Support', qty: 1, unitType: 'hour' },
            { id: 3, description: 'Design', qty: 1, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await page.getByTestId('rate-form-unit').fill('hour');
    await page.getByTestId('rate-form-price').fill('110');
    await page.getByTestId('rate-form-submit').click();
    await page.getByTestId('rate-form-unit').fill('day');
    await page.getByTestId('rate-form-price').fill('700');
    await page.getByTestId('rate-form-submit').click();
    // the draft's hours follow the card: 2 x 110.00
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('$110.00');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$220.00');
    await page.getByTestId('line-form-description').fill('Workshop');
    await page.getByTestId('line-form-unit-type').fill('day');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$700.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,012.00'); // (220.00 + 700.00) + 10%
    // the sent invoice keeps the 95.00 it was sent with
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-2').getByTestId('line-unit-price')).toHaveText('$95.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$214.50'); // (95.00 + 100.00) + 10%
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$214.50');
  });

  test('refuses a rate without a unit type or a price above zero', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', rates: [{ unitType: 'hour', unitPrice: 95 }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Consulting', qty: 2, unitType: 'hour' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('rate-form-unit').fill('');
    await page.getByTestId('rate-form-price').fill('100');
    await page.getByTestId('rate-form-submit').click();
    await expect(page.getByTestId('rate-form-error')).toBeVisible();
    await page.getByTestId('rate-form-unit').fill('hour');
    await page.getByTestId('rate-form-price').fill('0');
    await page.getByTestId('rate-form-submit').click();
    await expect(page.getByTestId('rate-form-error')).toBeVisible();
    await page.getByTestId('rate-form-unit').fill('hour');
    await page.getByTestId('rate-form-price').fill('12.345');
    await page.getByTestId('rate-form-submit').click();
    await expect(page.getByTestId('rate-form-error')).toBeVisible();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$190.00'); // 2 x 95.00
  });
});
