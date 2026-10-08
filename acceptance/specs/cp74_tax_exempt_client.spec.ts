import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A whole client can be marked tax exempt. Then none of their invoices carry any tax, whatever the
// lines or rate say.
test.describe('tax-exempt client', () => {
  test('charges no tax for a tax-exempt client', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', taxExempt: true }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$200.00');
  });
});
