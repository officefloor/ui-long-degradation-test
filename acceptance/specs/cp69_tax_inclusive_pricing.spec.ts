import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// For a tax-inclusive client the line prices already include tax, so the tax is worked back out of
// the total rather than added on. The invoice total is unchanged; the tax portion is shown.
test.describe('tax-inclusive pricing', () => {
  test('backs the tax out of a tax-inclusive price', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', taxInclusive: true }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 120 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-tax-mode')).toHaveText('Inclusive');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$20.00');   // 120 * 20/120
    await expect(page.getByTestId('invoice-amount')).toHaveText('$120.00'); // unchanged, tax is inside
  });
});
