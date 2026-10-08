import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE REVERSAL: the second tax (the levy) is scrapped. Invoices show only the one tax again,
// the levy line is gone, and totals work out as if the levy never existed. An invoice that once
// would have carried a levy now totals subtotal + tax: 200 + 20% = 240, with no levy line present.
test.describe('levy removed', () => {
  test('no levy line and the total excludes it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', taxPct: 20, levyPct: 5, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-tax-levy')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount')).toHaveText('$240.00');
  });
});
