import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each currency can have its own rounding step; amounts in that currency are rounded to it. Here a
// currency that rounds to the nearest five cents turns 10.12 into 10.10.
test.describe('currency rounding rule', () => {
  test('rounds to the currency step', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      currencies: [{ code: 'CHF', symbol: 'CHF ', roundingStep: 0.05 }],
      clients: [{ id: 1, name: 'Zurich AG', email: 'ops@zurich.example', currency: 'CHF' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 10.12 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('CHF 10.10');
  });
});
