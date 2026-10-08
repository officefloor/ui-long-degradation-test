import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Budget versus invoiced compares the amounts before tax, not the tax-inclusive totals.
test.describe('budget net of tax', () => {
  test('invoiced counts the pre-tax amounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, budget: 1000 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', taxPct: 20, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('project-invoiced')).toHaveText('$400.00');
    await expect(page.getByTestId('project-remaining')).toHaveText('$600.00');
  });
});
