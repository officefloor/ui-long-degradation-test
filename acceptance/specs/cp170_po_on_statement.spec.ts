import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The purchase-order number appears against the invoice on the client statement.
test.describe('PO on statement', () => {
  test('shows the PO number on the statement entry', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', poNumber: 'PO-5567', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-entry-row-1').getByTestId('statement-po')).toHaveText('PO-5567');
  });
});
