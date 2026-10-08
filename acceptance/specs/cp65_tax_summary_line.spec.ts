import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The invoice shows a clear tax line: what was taxed (invoice-taxable-base) and the tax that came
// to (invoice-tax), labelled with the rate (invoice-tax-label, e.g. "Tax (20%)").
test.describe('tax summary line', () => {
  test('shows the taxable base, the rate label and the tax', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', taxPct: 20,
        lineItems: [
          { id: 1, description: 'Design', qty: 1, unitPrice: 200 },
          { id: 2, description: 'Government fee', qty: 1, unitPrice: 100, taxExempt: true },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-tax-label')).toHaveText('Tax (20%)');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');
  });
});
