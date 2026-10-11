import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can be tax exempt (clients[].taxExempt, ticked when adding the client): their invoices
// charge no tax on any line, whatever the line's own rate.
test.describe('tax-exempt client', () => {
  test("charges no tax on a tax-exempt client's invoices", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', taxExempt: true },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 100 },
            { id: 2, description: 'Handbook', qty: 1, unitPrice: 50, taxRate: 5 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$150.00'); // 100.00 + 50.00
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.00'); // 10% of 100.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$110.00');
  });

  test('marks a new client tax exempt', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Food Bank');
    await page.getByTestId('client-form-email').fill('office@foodbank.example');
    await page.getByTestId('client-form-tax-exempt').check();
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Catering');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('100');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$100.00');
  });
});
