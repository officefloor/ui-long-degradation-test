import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The invoice shows the overall tax rate that actually landed on it — the tax as a percentage of
// the subtotal — which is lower than the headline rate when some lines are tax-free.
test.describe('effective tax rate', () => {
  test('shows tax as a percentage of the whole invoice', { tag: '@functionality' }, async ({ page }) => {
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

    // tax 40 on a subtotal of 300 -> 13.33%
    await expect(page.getByTestId('invoice-effective-tax-rate')).toHaveText('13.33%');
  });
});
