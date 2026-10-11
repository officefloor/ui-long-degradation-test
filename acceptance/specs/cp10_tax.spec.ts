import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Tax at the workspace rate (settings.taxRate, a percentage) is charged on the invoice subtotal,
// before any discount comes off, rounded half up to the cent. Grand total = subtotal - discount +
// tax, and the list total is the grand total.
test.describe('tax', () => {
  test('adds tax at the workspace rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Licences', qty: 3, unitPrice: 33.35 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$100.05'); // 3 x 33.35
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.01'); // 10% of 100.05 = 10.005 -> 10.01
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$110.06'); // 100.05 + 10.01
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$110.06');
  });

  test('charges tax alongside a discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [{ id: 1, description: 'Retainer', qty: 2, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00'); // 10% of 200.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$20.00'); // 10% of the 200.00 subtotal
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$200.00'); // 200.00 - 20.00 + 20.00
  });

  test('no tax rate means no tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Retainer', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$80.00'); // 1 x 80
  });
});
