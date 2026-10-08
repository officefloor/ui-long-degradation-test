import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Tax on each taxable line is rounded to the nearest cent, so no long trailing decimals appear.
test.describe('tax rounded per line', () => {
  test('rounds a taxable line\'s tax to the cent', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      // 100.50 at 8.25% = 8.29125 -> 8.29
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 8.25, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100.5 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-tax')).toHaveText('$8.29');
  });
});
