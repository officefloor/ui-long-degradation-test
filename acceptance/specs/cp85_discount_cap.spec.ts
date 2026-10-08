import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A percentage discount can be capped at a maximum dollar amount, so a large invoice does not give
// away more than the cap.
test.describe('discount cap', () => {
  test('caps a percentage discount at the maximum', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      // 10% of 1000 = 100, capped at 30
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, discountCap: 30, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-discount')).toHaveText('$30.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$970.00');
  });
});
