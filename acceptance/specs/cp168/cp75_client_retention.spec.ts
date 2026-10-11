import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]):
// retention is gone; clients have no standard retention, so its tests are replaced by one showing a
// duplicate keeping its plan and one showing a new client's invoice holding nothing back.
// Clients have no standard retention and new invoices hold nothing back. Duplicating an invoice
// keeps its instalment plan; the copy's schedule is dated from its new issue date.
test.describe('standard retention', () => {
  test('duplicating keeps the plan', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-03-31', instalments: 3,
          instalmentRate: 0,
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-duplicate').click();
    // the copy is issued today, so its instalments fall due on 04-10, 05-10, 06-10
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-04-10');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-06-10');
    // 110.00 over 3 at 0%: 37.00, 37.00, then the 36.00 left
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$36.00');
    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
  });

  test('new invoices hold nothing back', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-form-retention-pct')).toHaveCount(0);
    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Build');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('400');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$400.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$400.00');
    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
  });
});
