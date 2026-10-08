import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A payment larger than the invoices it was put against leaves the remainder as the client's credit.
test.describe('unallocated payment as credit', () => {
  test('leftover becomes available credit', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, clientId: 1, amount: 150, date: '2026-02-05', allocations: [{ invoiceId: 1, amount: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-available-credit')).toHaveText('$50.00');
  });
});
