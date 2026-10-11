import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; a duplicate has no plan to keep, so that test is replaced
// by one showing the copy with the lines alone. Carries the other test.
// Clients have no standard retention and new invoices hold nothing back. Duplicating an invoice
// copies its lines; there is no plan to copy.
test.describe('standard retention', () => {
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

  test('duplicating copies the lines and nothing else', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-duplicate').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,100.00');
  });
});
