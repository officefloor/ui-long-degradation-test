import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice can have a minimum charge. When the net total falls below it, the minimum is billed
// instead, and the invoice shows that the minimum was applied.
test.describe('minimum charge', () => {
  test('bills the minimum when the net total is lower', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', minimumCharge: 100, lineItems: [{ id: 1, description: 'Quick fix', qty: 1, unitPrice: 60 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-minimum-applied')).toBeVisible();
    await expect(page.getByTestId('invoice-amount')).toHaveText('$100.00');
  });
});
