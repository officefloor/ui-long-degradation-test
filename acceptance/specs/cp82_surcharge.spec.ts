import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A surcharge (for example a handling fee) can be added to an invoice; it adds to the total.
test.describe('invoice surcharge', () => {
  test('a surcharge adds to the total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', surcharge: 30, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-surcharge')).toHaveText('$30.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$230.00');
  });
});
