import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp48 (mutates: [12]): percentage discounts now round down to the cent, so 12.5% of
// 100.05 takes off $12.50 (not $12.51), leaving 87.55 taxed $8.76 for a grand total of $96.31.
// Carries the test; the 10% on 200.00 figures are unchanged.
// The discount (a percentage rounded down to the cent) comes off the subtotal first; tax is the rate on what is left, rounded half up to the
// cent. Grand total = subtotal - discount + tax.
test.describe('discount before tax', () => {
  test('charges tax on what is left after the discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [{ id: 1, description: 'Retainer', qty: 2, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 12.5,
          lineItems: [{ id: 2, description: 'Licences', qty: 3, unitPrice: 33.35 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00'); // 10% of 200.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$18.00'); // 10% of (200.00 - 20.00)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$198.00'); // 180.00 + 18.00

    await page.getByTestId('invoice-row-2').click();
    // subtotal 3 x 33.35 = 100.05; 12.5% = 12.50625 -> 12.50 (rounded down)
    await expect(page.getByTestId('invoice-discount')).toHaveText('$12.50');
    // 10% of (100.05 - 12.50 = 87.55) = 8.755 -> 8.76
    await expect(page.getByTestId('invoice-tax')).toHaveText('$8.76');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$96.31'); // 87.55 + 8.76
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('$96.31');
  });
});
