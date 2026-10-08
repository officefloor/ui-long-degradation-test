import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A one-screen financial summary for a client: billed, paid, outstanding and overdue.
test.describe('client financial summary', () => {
  test('shows billed, paid, outstanding and overdue', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 100, date: '2026-02-10' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-summary-open').click();

    await expect(page.getByTestId('client-summary-billed')).toHaveText('$300.00');
    await expect(page.getByTestId('client-summary-paid')).toHaveText('$100.00');
    await expect(page.getByTestId('client-summary-outstanding')).toHaveText('$200.00');
    await expect(page.getByTestId('client-summary-overdue')).toHaveText('$200.00');
  });
});
