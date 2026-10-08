import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The balance a client owed as at a chosen date can be shown, counting only entries up to that date.
test.describe('balance as of date', () => {
  test('shows the balance at a past date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 100, date: '2026-02-20' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    // as at 2026-02-10 the payment of 2026-02-20 has not happened yet -> 300 owed
    await page.getByTestId('statement-asof-date').fill('2026-02-10');
    await page.getByTestId('statement-asof-apply').click();
    await expect(page.getByTestId('client-balance-asof')).toHaveText('$300.00');
  });
});
