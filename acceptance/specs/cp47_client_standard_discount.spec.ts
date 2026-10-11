import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have a standard discount percentage (clients[].discountPct, entered when adding the
// client). New invoices for that client start with that percentage discount; a duplicated invoice
// keeps the invoice's own discount.
test.describe('client standard discount', () => {
  test("a new invoice starts with the client's discount", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', discountPct: 5 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31', discountPct: 12,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('200');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00'); // 5% of 200.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$190.00'); // 200.00 - 10.00
  });

  test("duplicating keeps the invoice's own discount", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', discountPct: 5 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31', discountPct: 12,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-duplicate').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000026'); // invoice_number_luhn(2)
    await expect(page.getByTestId('invoice-discount')).toHaveText('$12.00'); // 12% of 100.00, not the client's 5%
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$88.00'); // 100.00 - 12.00
  });

  test('sets a standard discount when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-discount-pct').fill('7.5');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('100');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-total')).toHaveText('$92.50'); // 100.00 - 7.50
    await expect(page.getByTestId('invoice-discount')).toHaveText('$7.50'); // 7.5% of 100.00
  });
});
