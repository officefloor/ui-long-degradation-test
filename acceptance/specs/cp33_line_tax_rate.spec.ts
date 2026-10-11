import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A line can have its own tax rate (lineItems[].taxRate, entered on the line form); lines without
// one use the workspace rate, a rate of 0 means no tax, and exempt lines stay untaxed whatever their
// rate. Each line's tax uses its own rate, rounded half up on the line.
test.describe('tax rate per line', () => {
  test('taxes each line at its own rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 1, unitPrice: 100 },
            { id: 2, description: 'Handbook', qty: 1, unitPrice: 40.10, taxRate: 5 },
            { id: 3, description: 'Postage', qty: 1, unitPrice: 9.90, taxExempt: true, taxRate: 5 },
            { id: 4, description: 'Gift card', qty: 1, unitPrice: 25, taxRate: 0 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$10.00'); // 10% of 100.00
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$2.01'); // 5% of 40.10 = 2.005 -> 2.01
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.00'); // exempt
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.00'); // rate 0, not the default
    await expect(page.getByTestId('invoice-tax')).toHaveText('$12.01'); // 10.00 + 2.01
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$175.00'); // 100.00 + 40.10 + 9.90 + 25.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$187.01'); // 175.00 + 12.01
  });

  test('adds a line with its own rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('line-form-description').fill('Software');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('10');
    await page.getByTestId('line-form-tax-rate').fill('20');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$2.00'); // 20% of 10.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.00'); // 10% of 50.00 = 5.00 + 2.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$67.00'); // 60.00 + 7.00
  });
});
