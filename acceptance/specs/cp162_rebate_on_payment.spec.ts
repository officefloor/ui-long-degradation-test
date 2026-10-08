import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// When an early payment qualifies for the rebate, the invoice settles for the reduced amount.
test.describe('rebate on early payment', () => {
  test('an early payment settles at the reduced amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-05',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', rebatePct: 2, dueDate: '2026-03-01',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 500 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 490, date: '2026-02-05' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });
});
