import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A draft invoice takes new lines from the line form. The description is required, the quantity is
// more than zero with at most two decimals, the unit price at least $0.01 with at most two
// decimals; a broken rule shows an error and adds nothing. A new line takes the next id after the
// highest line id, and the subtotal, grand total and list total update at once.
test.describe('line form', () => {
  test('adds a line and updates the totals', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 45 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 7, description: 'Audit', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('1.5');
    await page.getByTestId('line-form-unit-price').fill('12.35');
    await page.getByTestId('line-form-submit').click();

    // The highest line id is 7 (on another invoice), so the new line is 8.
    const line = page.getByTestId('line-row-8');
    await expect(line.getByTestId('line-description')).toHaveText('Hosting');
    await expect(line.getByTestId('line-qty')).toHaveText('1.5');
    await expect(line.getByTestId('line-unit-price')).toHaveText('$12.35');
    await expect(line.getByTestId('line-amount')).toHaveText('$18.53'); // 1.5 x 12.35 = 18.525 -> 18.53
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$108.53'); // 2 x 45 = 90.00 + 18.53
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$108.53');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$108.53');
  });

  test('refuses a line that breaks a rule', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 45 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    const bad = [
      ['', '1', '10'],           // no description
      ['Work', '0', '10'],       // quantity not more than zero
      ['Work', '1.255', '10'],   // three decimals in the quantity
      ['Work', '1', '0'],        // price below $0.01
      ['Work', '1', '9.999'],    // three decimals in the price
    ];
    for (const [description, qty, price] of bad) {
      await page.getByTestId('line-form-description').fill(description);
      await page.getByTestId('line-form-qty').fill(qty);
      await page.getByTestId('line-form-unit-price').fill(price);
      await page.getByTestId('line-form-submit').click();
      await expect(page.getByTestId('line-form-error')).toBeVisible();
      await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);
    }
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$90.00'); // 2 x 45
  });
});
