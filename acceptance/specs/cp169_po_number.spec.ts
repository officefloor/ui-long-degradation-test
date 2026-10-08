import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice can carry a purchase-order number, shown on the invoice.
test.describe('invoice PO number', () => {
  test('shows the PO number on the invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', poNumber: 'PO-5567', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-po-number')).toHaveText('PO-5567');
  });
});
