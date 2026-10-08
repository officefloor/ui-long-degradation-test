import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A tax-registered client has a tax number, recorded on the client and shown on their invoices.
// Anchors: client-tax-number (on the client page) and invoice-client-tax-number (on the invoice).
test.describe('client tax number', () => {
  test('shows the client tax number on the client and the invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', taxNumber: 'GB123456789' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-tax-number')).toHaveText('GB123456789');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();
    await expect(page.getByTestId('invoice-client-tax-number')).toHaveText('GB123456789');
  });
});
