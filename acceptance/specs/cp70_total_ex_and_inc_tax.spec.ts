import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The invoice shows the total both before and after tax.
test.describe('total before and after tax', () => {
  test('shows the ex-tax and inc-tax totals', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-total-ex-tax')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-total-inc-tax')).toHaveText('$240.00');
  });
});
