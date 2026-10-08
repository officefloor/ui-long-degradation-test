import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's page shows their lifetime value — what they have actually paid.
test.describe('client lifetime value', () => {
  test('sums what the client has paid', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'PAID', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'PAID', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, invoiceId: 1, amount: 200, date: '2026-02-01' },
        { id: 2, invoiceId: 2, amount: 100, date: '2026-02-05' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-lifetime-value')).toHaveText('$300.00');
  });
});
