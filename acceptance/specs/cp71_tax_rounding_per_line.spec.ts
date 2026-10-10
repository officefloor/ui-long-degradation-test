import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Tax on each taxable line is rounded to the nearest cent, so no long trailing decimals appear, and
// the invoice's tax is the sum of those rounded line taxes (not the tax on the total, rounded once).
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

  test('the invoice tax is the sum of the rounded line taxes', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      // Each line: 10.10 at 8.25% = 0.83325 -> 0.83, so the tax is 3 x 0.83 = 2.49.
      // (Taxing the 30.30 total once would give 2.49975 -> 2.50.)
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', taxPct: 8.25,
        lineItems: [
          { id: 1, description: 'A', qty: 1, unitPrice: 10.1 },
          { id: 2, description: 'B', qty: 1, unitPrice: 10.1 },
          { id: 3, description: 'C', qty: 1, unitPrice: 10.1 },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.49');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$32.79');
  });
});
