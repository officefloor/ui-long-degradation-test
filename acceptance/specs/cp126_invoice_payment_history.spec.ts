import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice lists its payments in date order with the running balance after each one.
test.describe('invoice payment history', () => {
  test('shows payments in date order with a running balance', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }] }],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-02-01' },
        { id: 2, invoiceId: 1, amount: 50, date: '2026-02-05' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('payment-row-1').getByTestId('payment-running-balance')).toHaveText('$200.00');
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-running-balance')).toHaveText('$150.00');
  });
});
