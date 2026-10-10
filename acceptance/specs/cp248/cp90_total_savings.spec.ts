import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED savings spec after stacking was reversed: the invoice still shows how much the client
// saved, which is now the one discount. A fixed 30 off 200 saves $30.00.
test.describe('total savings', () => {
  test('shows the discount as a savings figure', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountAmount: 30, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-total-savings')).toHaveText('$30.00');
  });
});
