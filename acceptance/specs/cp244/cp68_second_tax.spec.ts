import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED second-tax spec after the levy was scrapped: the levy rule is retired. An invoice shows
// only the one tax, there is no levy line, and the total is subtotal + tax: 200 + 20% = 240.
test.describe('second tax (levy)', () => {
  test('shows no levy line once the levy is scrapped', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', taxPct: 20,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');       // 20% of 200
    await expect(page.getByTestId('invoice-tax-levy')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount')).toHaveText('$240.00');   // 200 + 40
  });
});
