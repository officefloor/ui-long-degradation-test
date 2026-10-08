import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The statement lists the payments received within the period and totals them.
test.describe('statement payments in period', () => {
  test('totals payments inside the range only', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 500 }] }],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-01-20' },
        { id: 2, invoiceId: 1, amount: 150, date: '2026-02-10' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await page.getByTestId('statement-range-from').fill('2026-02-01');
    await page.getByTestId('statement-range-to').fill('2026-02-28');
    await page.getByTestId('statement-range-apply').click();

    await expect(page.getByTestId('statement-payments-total')).toHaveText('$150.00');
  });
});
