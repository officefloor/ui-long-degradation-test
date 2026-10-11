import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have a standard retention percentage (clients[].retentionPct, set when adding the
// client): their new invoices start with it. Duplicating an invoice keeps that invoice's own
// retention and instalment plan; the copy's schedule is dated from its new issue date.
test.describe('standard retention', () => {
  test("new invoices start with the client's retention", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', retentionPct: 5 }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-03-31', instalments: 3,
          instalmentRate: 0,
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-03-31',
          retentionPct: 10,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Build');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('100');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-retention')).toHaveText('$5.00'); // 5% of 100.00 before tax
  });

  test('duplicating keeps the plan and the retention', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', retentionPct: 5 }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-03-31', instalments: 3,
          instalmentRate: 0,
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-03-31',
          retentionPct: 10,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-duplicate').click();
    // the copy is issued today, so its instalments fall due on 04-10, 05-10, 06-10
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-04-10');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-06-10');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$36.66');
    // a duplicate keeps the invoice's own retention (10%), not the client's 5%
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('invoice-duplicate').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-retention')).toHaveText('$20.00'); // 10% of 200.00
  });

  test('sets a standard retention when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-retention-pct').fill('2.5');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Build');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('400');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-retention')).toHaveText('$10.00'); // 2.5% of 400.00
  });
});
